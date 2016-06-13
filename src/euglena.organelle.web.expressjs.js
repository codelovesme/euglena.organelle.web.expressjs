/// <reference path="../typings/express/express.d.ts" />
/// <reference path="../typings/serve-favicon/serve-favicon.d.ts" />
/// <reference path="../typings/morgan/morgan.d.ts" />
/// <reference path="../typings/cookie-parser/cookie-parser.d.ts" />
/// <reference path="../typings/body-parser/body-parser.d.ts" />
/// <reference path="../typings/express-session/express-session.d.ts" />
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var euglena_1 = require("../node_modules/euglena/euglena/src/euglena");
var euglena_template_1 = require("../node_modules/euglena/euglena_template/src/euglena_template");
var express = require('express');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var path = require("path");
var http = require("http");
var Particle = euglena_1.euglena.being.Particle;
var OrganelleName = "WebOrganelleImplExpressJs";
var organelle = null;
var this_ = null;
function impactReceived(impact, of) {
    return new euglena_template_1.euglena_template.being.alive.particles.ImpactReceived(impact, of);
}
function reference(name, of) {
    return new euglena_1.euglena.being.alive.dna.ParticleReference(name, of);
}
function particle_(name, content, of) {
    return new Particle(name, content, of);
}
var Organelle = (function (_super) {
    __extends(Organelle, _super);
    function Organelle() {
        _super.call(this, OrganelleName);
        this.router = null;
        this.server = null;
        this.router = express.Router();
        this_ = this;
        this.router.post("/", function (req, res, next) {
            this_.send(impactReceived(req.body, this_.name), function (particle) {
                res.send(JSON.stringify(particle));
            });
        });
        this.router.get("/", function (req, res, next) {
            var path = req.params.path;
            var euglenaName = req.headers["host"];
            res.render(this_.getView(path));
        });
        this.router.get("/:path", function (req, res, next) {
            var domain = req.headers["host"];
            var path = req.params.path;
            var euglenaName = domain + "/" + path;
            res.render(this_.getView(path));
        });
        this.router.get("/debug/:domain", function (req, res, next) {
            var domain = req.params.domain;
            var path = req.params.path;
            var euglenaName = domain;
            res.render(this_.getView(path));
        });
        this.router.get("/debug/:domain/:path", function (req, res, next) {
            var domain = req.params.domain;
            var path = req.params.path;
            var euglenaName = domain + "/" + path;
            res.render(this_.getView(path));
        });
    }
    Organelle.prototype.getView = function (path) {
        return (path ? path : "index") + "/view";
    };
    Organelle.prototype.serve = function () {
        var app = express();
        // view engine setup
        var appDir = path.dirname(require.main.filename);
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
        app.use(function (req, res, next) {
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
        app.use(function (req, res, next) {
            var err = new Error('Not Found');
            err.status = 404;
            next(err);
        });
        app.use(function (err, req, res, next) {
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
    };
    Organelle.prototype.onListening = function () {
        var addr = this_.server.address();
        var bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        console.log('Listening on ' + bind);
    };
    Organelle.prototype.onError = function (error) {
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
    };
    Organelle.prototype.receive = function (particle, response) {
        console.log("Organelle Web says 'received particle: " + particle.name + "'");
        switch (particle.name) {
            case euglena_template_1.euglena_template.being.ghost.organelle.web.constants.incomingparticles.Serve:
                this.serve();
                break;
            default:
                break;
        }
    };
    return Organelle;
})(euglena_template_1.euglena_template.being.alive.organelles.WebOrganelle);
exports.Organelle = Organelle;
//# sourceMappingURL=euglena.organelle.web.expressjs.js.map