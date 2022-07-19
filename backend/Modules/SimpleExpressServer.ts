import express, {Express} from 'express';
import StorageAPI from './StorageAPI';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from './User';

const SECRET = 'very_secret_code';
export class SimpleExpressServer {

    private _app: Express;
    private _users: StorageAPI<User>;

    constructor() {
        this._app = express();
        this._users = new StorageAPI<User>('./Data/UserData.json');
    }
    useMethods() {
        this._app.use(cors());
        this._app.use(express.json());
        this._app.use((req, res, next) => {
            if (req.path == '/api/register' || req.path == '/api/login') {
                return next();
            }
            
            const userAuth = {username: String(req.headers.username)};
            const tokenAuth = String(req.headers.token);
            console.log(tokenAuth, '\n', this._users.where(userAuth)[0].token)
            if(!this._users.contains(userAuth)) {
                return res.status(401).json({message: "not found in database"})
            }
            if(this._users.contains(userAuth) && tokenAuth == this._users.where(userAuth)[0].token) {
                return next();    
            }
            return res.status(401).json({message: "token not valid or lost connection"})
        })
    }
    postMethods() {
        this._app.post("/api/register", async (req, res) => {
            try {
                if (this._users.contains({username: req.body.username})) {
                    return res.status(401).json({message: "username with this name already connected"});
                }
                const hashPassword = await bcrypt.hash(req.body.password, 10);
                const user = {
                    username: req.body.username,
                    password: hashPassword,
                    token: null,
                    id: ''
                }
                this._users.addToStorage(user);
                res.status(200).json({message: "success to sign up user 😀"})
            }
            catch {
                res.status(500).json({message: "server error"})
            }
        });
        this._app.post('/api/login',  async(req, res) => {
            try {
                const user = this._users.where({username: req.body.username})[0];
                const match = await bcrypt.compare(req.body.password, user.password);
                if(!match) return res.status(400).json({msg: "Wrong Password"});
                const accessToken = jwt.sign({username: user.username }, SECRET ,{
                    expiresIn: '7d'
                });
                this._users.update(user.id, {token: accessToken});
                res.json({ accessToken });

            } catch (error) {
                res.status(500).json({message:"server error"});
            }
        })
    }
    getMethods() {
        this._app.get('/api/users',  (req, res) => {
            res.status(200).json({message: "test"});
        })
    }

    startServer(){
        this.useMethods();
        this.postMethods();
        this.getMethods();
        this._app.listen(5000, () => console.log('listen..'))
    }
}