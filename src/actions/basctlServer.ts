import * as vscode from 'vscode';
import * as net from 'net';
import * as fs from 'fs';
import * as _ from 'lodash';

const SOCKETFILE = '/extbin/basctlSocket';

let basctlServer: net.Server;


function handleRequest(socket: net.Socket) {
    socket.on('data', dataBuffer => {
        const data: any = getRequestData(dataBuffer);

        if (data.command === 'openExternal') {
            const uri = vscode.Uri.parse(data.url, true);
            vscode.env.openExternal(uri);
        }
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
                    throw new Error(err.stack);
                }
                createBasctlServer();
            });
        }
    });
}
