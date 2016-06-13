
/// <reference path="../typings/express/express.d.ts" />
/// <reference path="../typings/serve-favicon/serve-favicon.d.ts" />
/// <reference path="../typings/morgan/morgan.d.ts" />
/// <reference path="../typings/cookie-parser/cookie-parser.d.ts" />
/// <reference path="../typings/body-parser/body-parser.d.ts" />
/// <reference path="../typings/express-session/express-session.d.ts" />

"use strict";
import {cessnalib} from "../node_modules/cessnalib/cessnalib/src/cessnalib";
import {cessnalib_template} from "../node_modules/cessnalib/cessnalib_template/src/cessnalib_template";

import * as express from 'express';
import favicon = require('serve-favicon');
import * as logger from 'morgan';
import cookieParser = require('cookie-parser');
import bodyParser = require('body-parser');
import session = require('express-session');
import * as path from "path";
import * as http from "http";

import Particle = cessnalib.being.Particle;

const OrganelleName = "WebOrganelleImplExpressJs";
let organelle = null;

let this_:Organelle = null;

var vallueCell = new cessnalib.sys.type.Map<string,Particle>();

export class Organelle extends cessnalib_template.being.alive.organelles.WebOrganelle {
    private router:express.Router = null;
    private server:http.Server = null;
    constructor(){
        super(OrganelleName);
        this.router = express.Router();
        this_ = this;
        this.router.post("/", function(req, res, next) {
            console.log("dfdfdfdfdf : "+JSON.stringify(req));
            this_.nucleus.receiveParticle(new cessnalib_template.being.alive.particles.ImpactReceived(req.params,this_.name));
            let result = {result:"ok"};
            res.send(JSON.stringify(result));
        });
        this.router.get("/:path", function(req, res, next) {
            let path = req.params.path;
            res.render(path?path:"index");
        });
    }
    private serve(){
        let app = express();
        // view engine setup
        let appDir = path.dirname(require.main.filename);
        app.set('views', path.join(appDir,'../', 'views'));
        app.set('view engine', 'jade');
        // uncomment after placing your favicon in /public
        //app.use(favicon(path.join(__dirname,"../", 'public', 'favicon.ico')));
        app.use(logger('dev'));
        app.use(bodyParser.json({limit: '50mb'}));
        app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
        //app.use(bodyParser.json());
        //app.use(bodyParser.urlencoded({ extended: false }));
        app.use(cookieParser());
        app.use(session({
            secret: "codeloves.me",
            name: "websiteLoginSession",
            resave: true,
            saveUninitialized: true
        }));
        app.use(express.static(path.join(appDir,'../', 'public')));
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
        app.use((req, res, next)=> {
            var err = new Error('Not Found');
            err.status = 404;
            next(err);
        });
        
        app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction)=> {
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
    public receiveParticle(particle:Particle):void{
        console.log("Organelle Web says 'received particle: "+particle.name+"'");
        switch (particle.name) {
            case cessnalib_template.being.ghost.euglena.web.constants.incomingparticles.Serve:
                this.serve();
                break;
            default:
                break;
        }
    }
}
