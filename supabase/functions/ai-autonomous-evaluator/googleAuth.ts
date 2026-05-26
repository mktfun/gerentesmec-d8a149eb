import { SignJWT, importPKCS8 } from "https://esm.sh/jose@5.2.3";

export async function getGoogleAccessToken(credentials: any): Promise<string> {
  const { client_email, private_key, token_uri } = credentials;
  if (!client_email || !private_key) {
    throw new Error('Credenciais GCP inválidas. Faltam client_email ou private_key.');
  }

  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;

  const alg = 'RS256';
  const pkcs8 = private_key.replace(/\\n/g, '\n');
  const privateKey = await importPKCS8(pkcs8, alg);

  const jwt = await new SignJWT({
    iss: client_email,
    sub: client_email,
    aud: token_uri || 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/cloud-platform'
  })
    .setProtectedHeader({ alg, typ: 'JWT' })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(privateKey);

  const response = await fetch(token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Falha ao obter access token do Google: ${err}`);
  }

  const data = await response.json();
  return data.access_token;
}
