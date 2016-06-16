/// <reference path="../typings/express/express.d.ts" />
/// <reference path="../typings/serve-favicon/serve-favicon.d.ts" />
/// <reference path="../typings/morgan/morgan.d.ts" />
/// <reference path="../typings/cookie-parser/cookie-parser.d.ts" />
/// <reference path="../typings/body-parser/body-parser.d.ts" />
/// <reference path="../typings/express-session/express-session.d.ts" />
/// <reference path="../typings/node/node.d.ts" />
import { euglena } from "euglena";
import { euglena_template } from "euglena.template";
import Particle = euglena.being.Particle;
import interaction = euglena.being.interaction;
export declare class Organelle extends euglena_template.being.alive.organelles.WebOrganelle {
    private router;
    private server;
    constructor();
    private getView(path);
    private serve();
    onListening(): void;
    onError(error: any): void;
    receive(particle: Particle, response: interaction.Response): void;
}
