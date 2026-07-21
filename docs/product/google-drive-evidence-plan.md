# Google Drive evidence plan

## Product decision

Google Drive is a good fit for Cuenta Obra when it is optional. The provider
owns the original delivery photos in their own Drive; Cuenta Obra keeps only a
small reference (Drive file ID/link, material, project, time, and short note).
That avoids our storage bill while making the file visible to the person who
took it.

The app must still let a provider create a job, add a supplier, and mark a
delivery without Drive. A gardener with weak signal cannot be blocked by an
account connection or a photo upload.

## Intended flow

1. The provider creates a normal, visible Drive folder named `Cuenta Obra`.
2. From Android, they tap **Conectar Google Drive** once and grant only the
   `https://www.googleapis.com/auth/drive.file` scope.
3. On a receipt or delivery, the app takes/selects a photo and uploads it to
   that folder using a resumable upload.
4. Cuenta Obra records the Drive file ID, web link, material and timestamp;
   the client view says **Entrega confirmada** and can expose a shared proof
   only when the provider chooses to share it.
5. If the upload is interrupted, the material is still marked received and the
   photo remains queued for retry. Nothing is silently lost.

## Guardrails

- Never request the broad `drive` scope. Use `drive.file` so the app can only
  work with files it creates or that the user explicitly selects/shares.
- Do not use Drive `appDataFolder`: it is hidden and cannot be shared, which is
  wrong for proof the provider needs to find later.
- Do not put a Google client secret in the Android app. Native OAuth uses an
  installed-app code flow with PKCE; Android and web need their own OAuth client
  IDs and redirect configuration.
- Do not make Drive a sign-up requirement. Store the operational record first,
  then upload evidence when possible.
- The customer should never see suppliers, prices, or a Drive folder by default.

## Implementation gate

Before enabling the connection button, create a Google Cloud project and OAuth
consent screen for Cuenta Obra, then provide:

- Android OAuth client ID for `com.cuentasclaras.app` and its signing SHA-1.
- Web OAuth client ID and the production web redirect URI.
- The approved Drive scope above and the public app/privacy details required by
  Google's consent process.

With those values, the app can add the native OAuth and resumable upload layer
without introducing a Cuenta Obra media-storage service.

## Primary references

- [Google Drive API scopes](https://developers.google.com/workspace/drive/api/guides/api-specific-auth)
- [OAuth for native apps](https://developers.google.com/identity/protocols/oauth2/native-app)
- [Resumable uploads](https://developers.google.com/workspace/drive/api/guides/manage-uploads)
- [Drive app-data folder constraints](https://developers.google.com/workspace/drive/api/guides/appdata)
