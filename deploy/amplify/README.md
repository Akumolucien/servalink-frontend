# Amplify Hosting (manual deployment, no Git connection, no build minutes)

PREPARED, NOT EXECUTED. Creating the app is the first step that needs a URL, because the backend's `frontend_url`
is `https://main.<APP_ID>.amplifyapp.com`.

```bash
# 1. Build (production values come from .env: live API, user pool, client) and zip the CONTENTS of dist/
npm run build
(cd dist && zip -r ../dist-amplify.zip .)        # PowerShell: Compress-Archive -Path dist\* -DestinationPath dist-amplify.zip -Force

# 2. Create the app + branch (no repository, no auto-build, no auto branch creation)
APP_ID=$(aws amplify create-app --region us-east-1 --name servalink-web --platform WEB \
  --custom-rules file://deploy/amplify/rewrite-rules.json \
  --custom-headers file://deploy/amplify/custom-headers.yml \
  --query app.appId --output text)
aws amplify create-branch --region us-east-1 --app-id $APP_ID --branch-name main --stage PRODUCTION --no-enable-auto-build
echo "https://main.$APP_ID.amplifyapp.com"       # <- this is frontend_url for the backend deploy

# 3. Upload the zip and start the deployment
read JOB URL < <(aws amplify create-deployment --region us-east-1 --app-id $APP_ID --branch-name main --query "[jobId,zipUploadUrl]" --output text)
curl -T dist-amplify.zip "$URL"
aws amplify start-deployment --region us-east-1 --app-id $APP_ID --branch-name main --job-id $JOB
```

- HTTPS only; the default domain `*.amplifyapp.com` needs no certificate or DNS.
- The rewrite rule serves `index.html` (HTTP 200) for any path without a file extension, so deep links such as
  `/app/bookings/<id>` and `/admin/reports/<id>` work when opened directly from an e-mail.
- Rollback: re-deploy the previous zip (`create-deployment` + `start-deployment`), or delete the app.
- Not included yet: a Content-Security-Policy header (needs testing against Cognito, the API and S3 upload hosts).
