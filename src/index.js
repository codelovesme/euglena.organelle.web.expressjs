/// <reference path="../node_modules/euglena.template/src/index.d.ts"/>
/// <reference path="../typings/index.d.ts"/>
"use strict";
const euglena_1 = require("euglena");
const euglena_template_1 = require("euglena.template");
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require("path");
const http = require("http");
const io = require("socket.io");
const uuid = require("node-uuid");
var Particle = euglena_1.euglena.being.Particle;
var Exception = euglena_1.euglena.sys.type.Exception;
const OrganelleName = "WebOrganelleImplExpressJs";
let organelle = null;
let this_ = null;
function impactReceived(impact, of) {
    return new euglena_template_1.euglena_template.being.alive.particle.ImpactReceived(impact, of);
}
function reference(name, of) {
    return new euglena_1.euglena.being.alive.dna.ParticleReference({ name: name, of: of });
}
function particle_(name, content, of) {
    return new Particle({ name: name, of: of }, content);
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
        this.sessions = [];
    }
    bindActions(addAction) {
        addAction(euglena_template_1.euglena_template.being.alive.constants.particles.ConnectToEuglena, (particle) => {
            this_.connectToEuglena(particle.data);
        });
        addAction(euglena_template_1.euglena_template.being.alive.constants.particles.ThrowImpact, (particle) => {
            this_.throwImpact(particle.data.to, particle.data.impact);
        });
        addAction(euglena_template_1.euglena_template.being.alive.constants.particles.WebOrganelleSap, (particle) => {
            this_.sapContent = particle.data;
            this_.getAlive();
        });
    }
    getAlive() {
        //SHOULD Check token
        //Should Check validation of impact
        // should check them here because of no require sent it this kind of mass to Cytoplasm
        // think like tcp => http => impact => particle
        this.router.post("/", function (req, res, next) {
            let euglenaName = req.session.euglenaName = req.session.euglenaName || uuid.v1();
            let impact = req.body;
            if (req.body) {
                res.send(JSON.stringify(new euglena_template_1.euglena_template.being.alive.particle.Acknowledge(this_.sapContent.euglenaName)));
                impact.from = euglenaName;
                this_.send(impactReceived(impact, this_.name), this_.name);
            }
            else {
                res.send({ meta: {}, data: {} }, this_.sapContent.euglenaName);
            }
        });
        /*
        this.router.post("/auth", function (req, res, next) {
            let session: any = req.session;
            let proxy = session.proxy = req.body;
            let of = session.meta.of = req.body.meta.of;
            this_.sessions.push(session);
            this_.send(new euglena_template.being.alive.particle.Session({ proxy: proxy }, of), this_.name);
            res.send(JSON.stringify(new euglena_template.being.alive.particle.Acknowledge(this_.sapContent.euglenaName)));
        });
        */
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
        //app.use(logger('dev'));
        app.use(bodyParser.json({ limit: '50mb' }));
        app.use(bodyParser.urlencoded({ extended: true }));
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
        server.listen(this.sapContent.euglenaInfo.data.port);
        server.on('error', this.onError);
        server.on('listening', this.onListening);
        this.server = server;
        socket.on("connection", (socket) => {
            socket.on("bind", (euglenaInfo, callback) => {
                callback(true);
                this.sockets[euglenaInfo.data.name] = socket;
                this_.send(new euglena_template_1.euglena_template.being.alive.particle.ConnectedToEuglena(euglenaInfo, this_.sapContent.euglenaName), this_.name);
                this_.send(euglenaInfo, this_.name);
            });
            socket.on("impact", (impactAssumption) => {
                this_.send(new euglena_template_1.euglena_template.being.alive.particle.ImpactReceived(impactAssumption, this_.sapContent.euglenaName), this_.name);
            });
        });
    }
    getView(path) {
        return this.sapContent.singlePageApp ?
            (path && path.split(".").length > 1 ? path : "index") :
            (path ? path : "index");
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
        var bind = typeof this_.sapContent.euglenaInfo.data.port === 'string'
            ? 'Pipe ' + this_.sapContent.euglenaInfo.data.port
            : 'Port ' + this_.sapContent.euglenaInfo.data.port;
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
        if (this.servers[euglenaInfo.data.name]) {
            return;
        }
        var post_options;
        post_options.host = euglenaInfo.data.url;
        post_options.port = Number(euglenaInfo.data.port);
        post_options.path = "/";
        post_options.method = 'POST';
        post_options.headers = {
            'Content-Type': 'application/json'
        };
        let server = io("http://" + post_options.host + ":" + post_options.port);
        this.servers[euglenaInfo.data.name] = server;
        server.on("connect", (socket) => {
            server.emit("bind", this_.sapContent.euglenaInfo, (done) => {
                if (done) {
                    this_.send(new euglena_template_1.euglena_template.being.alive.particle.ConnectedToEuglena(euglenaInfo, this_.sapContent.euglenaName), this_.name);
                }
            });
            server.on("impact", (impactAssumption, callback) => {
                if (euglena_1.euglena.js.Class.instanceOf(euglena_template_1.euglena_template.reference.being.interaction.Impact, impactAssumption)) {
                    this.send(new euglena_template_1.euglena_template.being.alive.particle.ImpactReceived(impactAssumption, this_.sapContent.euglenaName), this_.name);
                }
                else {
                }
            });
        });
        server.on("disconnect", () => {
            this_.send(new euglena_template_1.euglena_template.being.alive.particle.DisconnectedFromEuglena(euglenaInfo, this_.sapContent.euglenaName), this_.name);
        });
    }
    throwImpact(to, impact) {
        var client = this.sockets[to.data.name];
        if (client) {
            client.emit("impact", impact, (resp) => {
                //TODO
            });
        }
        else {
            //TODO
            //response(new euglena_template.being.alive.particles.ExceptionOccurred(
            //  new euglena.sys.type.Exception("There is no gateway connected with that id: " + userId)));
            let server = this.servers[to.data.name];
            if (server) {
                server.emit("impact", impact);
            }
            else {
                //TODO
                var post_options = {
                    host: to.data.url,
                    port: Number(to.data.port),
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
                                this_.send(new euglena_template_1.euglena_template.being.alive.particle.ImpactReceived(impactAssumption, this_.sapContent.euglenaName), this_.name);
                            }
                            else {
                            }
                        }
                        catch (e) {
                        }
                    }
                    else {
                        //TODO write a eligable exception message
                        this_.send(new euglena_template_1.euglena_template.being.alive.particle.Exception(new Exception(""), this_.sapContent.euglenaName), this_.name);
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
//# sourceMappingURL=index.js.map