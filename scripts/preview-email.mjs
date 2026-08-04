/**
 * Preview local de templates de email.
 *
 * Renderiza el HTML compilado por MJML con los datos reales (LOGO_URL del .env)
 * y lo abre en el navegador. La salida va a dist/preview/ (gitignored).
 *
 * Uso: npm run preview:email
 */
import fs from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";
import Handlebars from "handlebars";

const TEMPLATE_NAME = process.env.EMAIL_TEMPLATE ?? "verificacion";

const cwd = process.cwd();
const envFile = path.join(cwd, ".env");
if (!fs.existsSync(envFile)) {
  console.error("No se encontro .env en la raiz del proyecto.");
  process.exit(1);
}

const env = fs.readFileSync(envFile, "utf8");
const envVar = (key) => env.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1] ?? "";

const logoUrl = process.env.EMAIL_LOGO_URL ?? envVar("LOGO_URL");

const templatesDir = path.join(cwd, "src", "adapters", "out", "email", "templates");
const source = path.join(templatesDir, `${TEMPLATE_NAME}.html`);
if (!fs.existsSync(source)) {
  console.error(`No existe el template compilado: ${source}. Corre antes: npm run build:emails`);
  process.exit(1);
}

const html = fs.readFileSync(source, "utf8");
const renderData = {
  logoUrl,
  horasExpiracion: 24,
  nombre: "Vicente",
  link: "http://localhost:3000/api/v1/auth/confirmar?token=e7a2c4f8-9b1d-4e3a-8c6f-0d5b2a1e9c7d",
};
if (TEMPLATE_NAME === "bienvenida") {
  renderData.avisoFooter = "Gracias por unirte a FadeForge.";
}
const rendered = Handlebars.compile(html)(renderData);

const outDir = path.join(cwd, "dist", "preview");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${TEMPLATE_NAME}.html`);
fs.writeFileSync(outFile, rendered);

console.log(`Preview renderizado: ${outFile}`);
if (process.platform === "win32") {
  exec(`start "" "${outFile}"`);
} else {
  exec(`open "${outFile}"`);
}
