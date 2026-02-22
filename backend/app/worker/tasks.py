from .celery_app import celery_app
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import RepositorySyncTask
import subprocess
import os
import shutil
import tempfile

@celery_app.task(bind=True, max_retries=0)
def sync_repository(self, task_id: int, github_repo_url: str, gitee_repo_url: str, github_pat: str, gitee_pat: str):
    """
    Synchronizes a repository from GitHub to Gitee using git mirror.
    """
    db: Session = SessionLocal()
    task = db.query(RepositorySyncTask).filter(RepositorySyncTask.id == task_id).first()
    if not task:
        db.close()
        return {"status": "Failed", "error": "Task not found"}

    task.status = "syncing"
    db.commit()

    try:
        # 1. Format URLs with credentials
        gh_auth_url = github_repo_url.replace("https://", f"https://oauth2:{github_pat}@")
        if not gh_auth_url.endswith('.git'):
            gh_auth_url += ".git"
            
        gt_auth_url = gitee_repo_url.replace("https://", f"https://oauth2:{gitee_pat}@")
        if not gt_auth_url.endswith('.git'):
            gt_auth_url += ".git"

        # 2. Ensure Gitee repository exists
        import requests
        repo_name = github_repo_url.split("/")[-1].replace(".git", "")
        
        gitee_api_url = f"https://gitee.com/api/v5/repos/{gitee_repo_url.split('/')[-2]}/{repo_name}"
        res = requests.get(gitee_api_url, params={"access_token": gitee_pat})
        
        if res.status_code == 404:
            print(f"📦 Repository {repo_name} not found on Gitee, creating...")
            create_res = requests.post(
                "https://gitee.com/api/v5/user/repos",
                data={
                    "access_token": gitee_pat,
                    "name": repo_name,
                    "private": True,
                    "description": f"Mirrored from {github_repo_url}"
                }
            )
            if create_res.status_code != 201:
                raise Exception(f"Failed to create Gitee repository: {create_res.text}")

        # 3. Create a temporary directory
        with tempfile.TemporaryDirectory() as temp_dir:
            print(f"⬇️ Cloning {github_repo_url} into {temp_dir}")
            
            # 4. Clone mirror from GitHub
            clone_cmd = ["git", "clone", "--mirror", gh_auth_url, "repo.git"]
            subprocess.run(clone_cmd, cwd=temp_dir, check=True, capture_output=True, text=True)
            
            repo_dir = os.path.join(temp_dir, "repo.git")

            # 5. Push to Gitee: try --mirror first, fallback to --all
            push_mode = "mirror"
            try:
                print(f"⬆️ Pushing (--mirror) to {gitee_repo_url}")
                push_cmd = ["git", "push", "--mirror", gt_auth_url]
                subprocess.run(push_cmd, cwd=repo_dir, check=True, capture_output=True, text=True)
            except subprocess.CalledProcessError as mirror_err:
                stderr = mirror_err.stderr or ""
                if "deny updating a hidden ref" in stderr or "remote rejected" in stderr:
                    print(f"⚠️ Mirror push rejected, falling back to --all + --tags")
                    push_mode = "all"
                    # Push all branches
                    push_all_cmd = ["git", "push", "--all", gt_auth_url]
                    subprocess.run(push_all_cmd, cwd=repo_dir, check=True, capture_output=True, text=True)
                    # Push all tags
                    push_tags_cmd = ["git", "push", "--tags", gt_auth_url]
                    subprocess.run(push_tags_cmd, cwd=repo_dir, check=True, capture_output=True, text=True)
                else:
                    raise  # Re-raise if it's a different error

        # 6. Success
        task.status = "completed"
        db.commit()
        print(f"✅ Sync completed ({push_mode}): {github_repo_url} -> {gitee_repo_url}")
        return {'status': 'Completed', 'mode': push_mode, 'github': github_repo_url, 'gitee': gitee_repo_url}
    
    except subprocess.CalledProcessError as e:
        error_msg = f"Git command failed: {e.stderr}"
        print(f"❌ {error_msg}")
        task.status = "failed"
        task.error_message = error_msg
        db.commit()
        return {'status': 'Failed', 'error': error_msg}
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Task failed: {error_msg}")
        task.status = "failed"
        task.error_message = error_msg
        db.commit()
        return {'status': 'Failed', 'error': error_msg}
    finally:
        db.close()
