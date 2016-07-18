
/// <reference path="../typings/express/express.d.ts" />
/// <reference path="../typings/socket.io/socket.io.d.ts" />
/// <reference path="../typings/serve-favicon/serve-favicon.d.ts" />
/// <reference path="../typings/morgan/morgan.d.ts" />
/// <reference path="../typings/cookie-parser/cookie-parser.d.ts" />
/// <reference path="../typings/body-parser/body-parser.d.ts" />
/// <reference path="../typings/express-session/express-session.d.ts" />
/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../node_modules/euglena.template/src/index.d.ts"/>


"use strict";
import {euglena} from "euglena";
import {euglena_template} from "euglena.template";

import * as express from 'express';
import favicon = require('serve-favicon');
import * as logger from 'morgan';
import cookieParser = require('cookie-parser');
import bodyParser = require('body-parser');
import session = require('express-session');
import * as path from "path";
import * as http from "http";
import * as io from "socket.io";
import constants = euglena_template.being.alive.constants;
import particles = euglena_template.being.alive.particles;

import Particle = euglena.being.Particle;
import interaction = euglena.being.interaction;
import Exception = euglena.sys.type.Exception;

const OrganelleName = "WebOrganelleImplExpressJs";
let organelle: Organelle = null;

let this_: Organelle = null;

function impactReceived(impact: euglena.being.interaction.Impact, of: string) {
    return new euglena_template.being.alive.particles.ImpactReceived(impact, of);
}

function reference(name: string, of: string) {
    return new euglena.being.alive.dna.ParticleReference(name, of);
}

function particle_(name: string, content: any, of: string) {
    return new Particle(name, content, of);
}

export class Organelle extends euglena_template.being.alive.organelles.WebOrganelle {
    private router: express.Router = null;
    private server: http.Server = null;
    private sockets: any;
    private servers: any;
    private httpConnector: HttpRequestManager;
    constructor() {
        super(OrganelleName);
        this.router = express.Router();
        this.sockets = {};
        this.servers = {};
        this_ = this;
        this.router.post("/", function (req, res, next) {
            let session: any = req.session;
            req.body.token = session.token;
            this_.send(impactReceived(req.body, this_.name));
        });
        this.router.post("/auth", function (req, res, next) {
            let session: any = req.session;
            let token = session.token = req.body.content;
            let of = req.body.of;
            this_.send(new euglena_template.being.ghost.organelle.web.outgoingparticles.Session({ token: token }, of));
            res.send(JSON.stringify(new euglena_template.being.alive.particles.Acknowledge("euglena.organelle.web")));
        });
        this.router.get("/", function (req, res, next) {
            let path = req.params.path;
            let euglenaName = req.headers["host"];
            res.render(this_.getView(path));
        });
        this.router.get("/:path", function (req, res, next) {
            let domain = req.headers["host"];
            let path = req.params.path;
            let euglenaName = domain + "/" + path;
            res.render(this_.getView(path));
        });
        this.router.get("/debug/:domain", function (req, res, next) {
            let domain = req.params.domain;
            let path = req.params.path;
            let euglenaName = domain;
            res.render(this_.getView(path));
        });
        this.router.get("/debug/:domain/:path", function (req, res, next) {
            let domain = req.params.domain;
            let path = req.params.path;
            let euglenaName = domain + "/" + path;
            res.render(this_.getView(path));
        });
    }
    private getView(path: string): string {
        return (path ? path : "index");
    }
    public receive(particle: Particle): void {
        console.log("Organelle Web says 'received particle: " + particle.name + "'");
        switch (particle.name) {
            case euglena_template.being.ghost.organelle.web.constants.incomingparticles.Serve:
                this.serve();
                break;
            default:
                break;
        }
    }
    private serve() {
        let app = express();
        // view engine setup
        let appDir = path.dirname(require.main.filename);
        app.set('views', path.join(appDir, '../', 'views'));
        app.set('view engine', 'jade');
        // uncomment after placing your favicon in /public
        //app.use(favicon(path.join(__dirname,"../", 'public', 'favicon.ico')));
        app.use(logger('dev'));
        app.use(bodyParser.json({ limit: '50mb' }));
        app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
        //app.use(bodyParser.json());
        //app.use(bodyParser.urlencoded({ extended: false }));
        app.use(cookieParser());
        app.use(session({
            secret: "codeloves.me",
            name: "websiteLoginSession",
            resave: true,
            saveUninitialized: true
        }));
        app.use(express.static(path.join(appDir, '../', 'public')));
        app.use('/', this.router);
        app.use((req, res, next) => {
            var session: any = req.session;
            var err = session.error,
                msg = session.success;
            delete session.error;
            delete session.success;
            res.locals.message = '';
            if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
            if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
            next();
        });
        // catch 404 and forward to error handler
        app.use((req, res, next) => {
            var err: any = new Error('Not Found');
            err.status = 404;
            next(err);
        });

        app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: {}
            });
        });

        var server = http.createServer(app);

        /**
         * Listen on provided port, on all network interfaces.
         */

        server.listen(this.initialProperties.port);
        server.on('error', this.onError);
        server.on('listening', this.onListening);
        this.server = server;

        let socket = io.listen(server);
        server.listen(this.initialProperties.port);
        socket.on("connection", (socket: any) => {
            socket.on("bind", (euglenaInfo: euglena_template.being.alive.particles.EuglenaInfo) => {
                this.sockets[euglenaInfo.name] = socket;
                this_.send(new euglena_template.being.ghost.organelle.reception.outgoingparticles.ConnectedToEuglena(euglenaInfo, this_.name));
            });
            socket.on("impact", (impactAssumption: euglena.being.interaction.Impact) => {
                this_.send(new euglena_template.being.ghost.organelle.reception.outgoingparticles.ImpactReceived(impactAssumption as euglena.being.interaction.Impact, euglena_template.being.alive.constants.organelles.Net));
            });
        });
    }
    onListening() {
        var addr = this_.server.address();
        var bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        console.log('Listening on ' + bind);
    }
    onError(error: any) {
        if (error.syscall !== 'listen') {
            throw error;
        }

        var bind = typeof this_.initialProperties.port === 'string'
            ? 'Pipe ' + this_.initialProperties.port
            : 'Port ' + this_.initialProperties.port;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    }
    private connectToEuglena(euglenaInfo: euglena_template.being.alive.particles.EuglenaInfo) {
        if (this.servers[euglenaInfo.name]) {
            return;
        }
        var post_options: http.RequestOptions;
        post_options.host = euglenaInfo.url;
        post_options.port = Number(euglenaInfo.port);
        post_options.path = "/";
        post_options.method = 'POST';
        post_options.headers = {
            'Content-Type': 'application/json'
        };
        let server = io("http://" + post_options.host + ":" + post_options.port);
        this.servers[euglenaInfo.name] = server;
        server.on("connect", (socket: SocketIO.Socket) => {
            server.emit("bind", this_.initialProperties.euglenaInfo, (done: boolean) => {
                if (done) {
                    this_.send(new euglena_template.being.ghost.organelle.reception.outgoingparticles.ConnectedToEuglena(euglenaInfo, this_.name));
                }
            });
            server.on("impact", (impactAssumption: any, callback: (impact: euglena.being.interaction.Impact) => void) => {
                if (euglena.js.Class.instanceOf<euglena.being.interaction.Impact>(euglena_template.reference.being.interaction.Impact, impactAssumption)) {
                    this.send(new euglena_template.being.ghost.organelle.reception.outgoingparticles.ImpactReceived(impactAssumption, OrganelleName));
                } else {
                    //TODO
                }
            });
        });
        server.on("disconnect", () => {
            this_.send(new euglena_template.being.ghost.organelle.reception.outgoingparticles.DisconnectedFromEuglena(euglenaInfo, this_.name));
        });
    }
    private throwImpact(to: euglena_template.being.alive.particles.EuglenaInfo, impact: euglena.being.interaction.Impact): void {
        var client = this.sockets[to.name];
        if (client) {
            client.emit("impact", impact, (resp: euglena.being.interaction.Impact) => {
                //TODO
            });
        } else {
            //TODO
            //response(new euglena_template.being.alive.particles.ExceptionOccurred(
            //  new euglena.sys.type.Exception("There is no gateway connected with that id: " + userId)));
            let server = this.servers[to.name];
            if (server) {
                server.emit("impact", impact);
            } else {
                //TODO
                var post_options = {
                    host: to.url,
                    port: Number(to.port),
                    path: "/",
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
                let httpConnector = new HttpRequestManager(post_options);
                httpConnector.sendMessage(JSON.stringify(impact), (message:any) => {
                    if (euglena.sys.type.StaticTools.Exception.isNotException<string>(message)) {
                        try {
                            let impactAssumption = JSON.parse(message);
                            if (euglena.js.Class.instanceOf(euglena_template.reference.being.interaction.Impact, impactAssumption)) {
                                this_.send(new euglena_template.being.ghost.organelle.reception.outgoingparticles.ImpactReceived(impactAssumption as euglena.being.interaction.Impact, OrganelleName));
                            } else {
                                //TODO log
                            }
                        } catch (e) {
                            //TODO
                        }
                    } else {
                        //TODO write a eligable exception message
                        this_.send(new euglena_template.being.alive.particles.Exception(new Exception(""), OrganelleName));
                    }

                });
            }
        }
    }
}
export class HttpRequestManager {
    constructor(public post_options: http.RequestOptions) { }
    public sendMessage(message: string, callback: euglena.sys.type.Callback<string>): void {
        var req = http.request(this.post_options, (res) => {
            res.setEncoding('utf8');
            var str = '';
            res.on('data', (data: string) => {
                str += data;
            });
            res.on('end', (data: string) => {
                callback(str);
            });
        });
        req.setTimeout(10000, () => {
            req.abort();
            callback(new Exception("Request timed out."));
        });
        req.on('error', (e: any) => {
            callback(new Exception("problem with request: " + e.message));
        });
        if (message) req.write(message);
        req.end();
    }
}