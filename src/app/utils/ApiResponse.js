const {server_message,server_status} = require('../../config/messages');

const FormatResponse=(status,message,data)=>{
    return {
        status,
        message,data
    }
}

const ResponseOk=(res,code=200,data=null)=>{
    res.status(code);
    res.setHeader('Content-Type', 'application/json');
    const MyResponse = JSON.stringify(FormatResponse(server_status.ok,server_message.ok,data?data:[]));
    res.send(MyResponse);
}

const ResponseError=(res,code=400,data=null)=>{
    res.status(code);
    res.setHeader('Content-Type', 'application/json');
    const MyResponse = JSON.stringify(FormatResponse(server_status.error,server_message.error,data?data:[]));
    res.send(MyResponse);
}

const ResponseException=(res,code=500,codeException="ERROR_EXCEPTION")=>{
    res.status(code);
    res.setHeader('Content-Type', 'application/json');
    const MyResponse = JSON.stringify(FormatResponse(server_status.exception,server_message.exception,codeException));
    res.send(MyResponse);
}

module.exports = {ResponseOk, ResponseError, ResponseException}