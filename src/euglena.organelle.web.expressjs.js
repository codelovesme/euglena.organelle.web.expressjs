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
const euglena_1 = require("euglena");
const euglena_template_1 = require("euglena.template");
const express = require('express');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require("path");
const http = require("http");
const io = require("socket.io");
var Particle = euglena_1.euglena.being.Particle;
var Exception = euglena_1.euglena.sys.type.Exception;
const OrganelleName = "WebOrganelleImplExpressJs";
let organelle = null;
let this_ = null;
function impactReceived(impact, of) {
    return new euglena_template_1.euglena_template.being.alive.particle.ImpactReceived(impact, of);
}
function reference(name, of) {
    return new euglena_1.euglena.being.alive.dna.ParticleReference(name, of);
}
function particle_(name, content, of) {
    return new Particle(name, content, of);
}
class Organelle extends euglena_template_1.euglena_template.being.alive.organelle.WebOrganelle {
    constructor() {
        super(OrganelleName);
        this.router = null;
        this.server = null;
        this_ = this;
        this.router = express.Router();
        this.sockets = {};
        this.servers = {};
        this.addAction(euglena_template_1.euglena_template.being.alive.constants.particles.ConnectToEuglena, (particle) => {
            this_.connectToEuglena(particle.content);
        });
        this.addAction(euglena_template_1.euglena_template.being.alive.constants.particles.ThrowImpact, (particle) => {
            this_.throwImpact(particle.content.to, particle.content.impact);
        });
    }
    onGettingAlive() {
        this.router.post("/", function (req, res, next) {
            let session = req.session;
            req.body.token = session.token;
            this_.send(impactReceived(req.body, this_.name));
        });
        this.router.post("/auth", function (req, res, next) {
            let session = req.session;
            let token = session.token = req.body.content;
            let of = req.body.of;
            this_.send(new euglena_template_1.euglena_template.being.alive.particle.Session({ token: token }, of));
            res.send(JSON.stringify(new euglena_template_1.euglena_template.being.alive.particle.Acknowledge("euglena.organelle.web")));
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
            var session = req.session;
            var err = session.error, msg = session.success;
            delete session.error;
            delete session.success;
            res.locals.message = '';
            if (err)
                res.locals.message = '<p class="msg error">' + err + '</p>';
            if (msg)
                res.locals.message = '<p class="msg success">' + msg + '</p>';
            next();
        });
        // catch 404 and forward to error handler
        app.use((req, res, next) => {
            var err = new Error('Not Found');
            err.status = 404;
            next(err);
        });
        app.use((err, req, res, next) => {
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
        let socket = io.listen(server);
        server.listen(this.sap.euglenaInfo.port);
        server.on('error', this.onError);
        server.on('listening', this.onListening);
        this.server = server;
        socket.on("connection", (socket) => {
            socket.on("bind", (euglenaInfo) => {
                this.sockets[euglenaInfo.name] = socket;
                this_.send(new euglena_template_1.euglena_template.being.alive.particle.ConnectedToEuglena(euglenaInfo, this_.name));
            });
            socket.on("impact", (impactAssumption) => {
                this_.send(new euglena_template_1.euglena_template.being.alive.particle.ImpactReceived(impactAssumption, euglena_template_1.euglena_template.being.alive.constants.organelles.NetOrganelle));
            });
        });
    }
    getView(path) {
        return (path ? path : "index");
    }
    onListening() {
        var addr = this_.server.address();
        var bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        console.log('Listening on ' + bind);
    }
    onError(error) {
        if (error.syscall !== 'listen') {
            throw error;
        }
        var bind = typeof this_.sap.euglenaInfo.port === 'string'
            ? 'Pipe ' + this_.sap.euglenaInfo.port
            : 'Port ' + this_.sap.euglenaInfo.port;
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
    connectToEuglena(euglenaInfo) {
        if (this.servers[euglenaInfo.name]) {
            return;
        }
        var post_options;
        post_options.host = euglenaInfo.url;
        post_options.port = Number(euglenaInfo.port);
        post_options.path = "/";
        post_options.method = 'POST';
        post_options.headers = {
            'Content-Type': 'application/json'
        };
        let server = io("http://" + post_options.host + ":" + post_options.port);
        this.servers[euglenaInfo.name] = server;
        server.on("connect", (socket) => {
            server.emit("bind", this_.sap.euglenaInfo, (done) => {
                if (done) {
                    this_.send(new euglena_template_1.euglena_template.being.alive.particle.ConnectedToEuglena(euglenaInfo, this_.name));
                }
            });
            server.on("impact", (impactAssumption, callback) => {
                if (euglena_1.euglena.js.Class.instanceOf(euglena_template_1.euglena_template.reference.being.interaction.Impact, impactAssumption)) {
                    this.send(new euglena_template_1.euglena_template.being.alive.particle.ImpactReceived(impactAssumption, OrganelleName));
                }
                else {
                }
            });
        });
        server.on("disconnect", () => {
            this_.send(new euglena_template_1.euglena_template.being.alive.particle.DisconnectedFromEuglena(euglenaInfo, this_.name));
        });
    }
    throwImpact(to, impact) {
        var client = this.sockets[to.name];
        if (client) {
            client.emit("impact", impact, (resp) => {
                //TODO
            });
        }
        else {
            //TODO
            //response(new euglena_template.being.alive.particles.ExceptionOccurred(
            //  new euglena.sys.type.Exception("There is no gateway connected with that id: " + userId)));
            let server = this.servers[to.name];
            if (server) {
                server.emit("impact", impact);
            }
            else {
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
                httpConnector.sendMessage(JSON.stringify(impact), (message) => {
                    if (euglena_1.euglena.sys.type.StaticTools.Exception.isNotException(message)) {
                        try {
                            let impactAssumption = JSON.parse(message);
                            if (euglena_1.euglena.js.Class.instanceOf(euglena_template_1.euglena_template.reference.being.interaction.Impact, impactAssumption)) {
                                this_.send(new euglena_template_1.euglena_template.being.alive.particle.ImpactReceived(impactAssumption, OrganelleName));
                            }
                            else {
                            }
                        }
                        catch (e) {
                        }
                    }
                    else {
                        //TODO write a eligable exception message
                        this_.send(new euglena_template_1.euglena_template.being.alive.particle.Exception(new Exception(""), OrganelleName));
                    }
                });
            }
        }
    }
}
exports.Organelle = Organelle;
class HttpRequestManager {
    constructor(post_options) {
        this.post_options = post_options;
    }
    sendMessage(message, callback) {
        var req = http.request(this.post_options, (res) => {
            res.setEncoding('utf8');
            var str = '';
            res.on('data', (data) => {
                str += data;
            });
            res.on('end', (data) => {
                callback(str);
            });
        });
        req.setTimeout(10000, () => {
            req.abort();
            callback(new Exception("Request timed out."));
        });
        req.on('error', (e) => {
            callback(new Exception("problem with request: " + e.message));
        });
        if (message)
            req.write(message);
        req.end();
    }
}
exports.HttpRequestManager = HttpRequestManager;
//# sourceMappingURL=euglena.organelle.web.expressjs.js.map