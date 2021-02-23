import * as vscode from 'vscode';
import * as net from 'net';
import * as fs from 'fs';
import * as _ from 'lodash';
import { _performAction } from './performer';
import { ActionsFactory } from './actionsFactory';

const SOCKETFILE = '/extbin/basctlSocket';

let basctlServer: net.Server;


function handleRequest(socket: net.Socket) {
    socket.on('data', dataBuffer => {
        (async () => {
            const data: any = getRequestData(dataBuffer);
            let result;
            try {
                const action = ActionsFactory.createAction(data);
                result = await _performAction(action);
            } catch (error) {
                showErrorMessage(error, 'failed to perform action');
                result = false;
            }
            socket.write(JSON.stringify({ result }));
        })();        
    });
}

function getRequestData(dataBuffer: any) {
    try {
        return JSON.parse(_.toString(dataBuffer));
    } catch (error) {
        showErrorMessage(error, 'failed to parse basctl request data');
        return {};
    }
}

function showErrorMessage(error: any, defaultError: string) {
    const errorMessage = _.get(error, 'stack', _.get(error, 'message', defaultError));
    vscode.window.showErrorMessage(errorMessage);
}

export function closeBasctlServer() {
    if (basctlServer) {
        basctlServer.close();
    }
}

function createBasctlServer() {
    try {
        basctlServer = net.createServer(socket => {
            handleRequest(socket);
        }).listen(SOCKETFILE);
    } catch (error) {
        showErrorMessage(error, 'basctl server error');
    }
}

export function startBasctlServer() {
    fs.stat(SOCKETFILE, err => {
        if (err) {
            createBasctlServer();
        } else {
            fs.unlink(SOCKETFILE, err => {
                if (err) {
                    throw new Error(`Failed to unlink socket ${SOCKETFILE}:\n` + err.stack);
                }
                createBasctlServer();
            });
        }
    });
}
