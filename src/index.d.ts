/// <reference path="../typings/index.d.ts" />
import { euglena } from "euglena";
import { euglena_template } from "euglena.template";
import * as http from "http";
import Particle = euglena.being.Particle;
export declare class Organelle extends euglena_template.being.alive.organelle.WebOrganelle {
    private router;
    private server;
    private sockets;
    private servers;
    private sessions;
    private httpConnector;
    private sapContent;
    constructor();
    protected bindActions(addAction: (particleName: string, action: (particle: Particle) => void) => void): void;
    private getAlive();
    private getEuglenaName(session);
    private generateEuglenaName();
    private getView(path);
    private onListening();
    private onError(error);
    private connectToEuglena(euglenaInfo);
    private throwImpact(to, impact);
}
export declare class HttpRequestManager {
    post_options: http.RequestOptions;
    constructor(post_options: http.RequestOptions);
    sendMessage(message: string, callback: euglena.sys.type.Callback<string>): void;
}
