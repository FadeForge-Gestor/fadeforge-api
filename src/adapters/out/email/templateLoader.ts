import { readFileSync } from 'fs';
import { join } from 'path';
import Handlebars from 'handlebars';

const TEMPLATES_DIR = join(__dirname, 'templates');

export function loadTemplate(nombre: string) {
    const path = join(TEMPLATES_DIR, `${nombre}.hbs`);
    const source = readFileSync(path, 'utf-8');
    return Handlebars.compile(source);
}
