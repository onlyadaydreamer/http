let net = require('net');

const ReadyState = {
  UNSENT: 0, //（代理被创建，但尚未调用 open() 方法。
  OPENED: 1, //open() 方法已经被调用
  HEADERS_RECEIVED: 2, //send() 方法已经被调用，并且头部和状态已经可获得。
  LOADING: 3, //（交互）正在解析响应内容
  DONE: 4 //（完成）响应内容解析完成，可以在客户端调用了
};
class XMLHttpRequest {
  constructor() {
    this.readyState = ReadyState.UNSENT; // 默认是初始化的，未调用open方法
    this.headers = { Connection: 'keep-alive' };
  }
  open(method, url) {
    this.method = method || 'GET';
    this.url = url;
    let { hostname, port, path } = require('url').parse(url);
    this.hostname = hostname;
    this.port = port;
    this.path = path;
    this.headers.Host = `${hostname}:${port}`;
    // 通过传输层的net模块发起请求
    const socket = (this.socket = net.createConnection(
      { port: this.port, hostname: this.hostname },
      () => {
        // 连接成功之后， 监听服务端响应
        socket.on('data', (data) => {
          data = data.toString();
          console.log('data', data);

          let [response, bodyRows] = data.split('\r\n\r\n'); // 分割响应行+响应头 和 响应体
          let [statusLine, ...headerRows] = response.split('\r\n'); // 分割响应行 和 响应头
          let [, status, statusText] = statusLine.split(' ');

          this.status = status;
          this.statusText = statusText;

          // 响应头
          this.responseHeaders = headerRows.reduce((memo, row) => {
            let [key, value] = row.split(': ');
            memo[key] = value;
            return memo;
          }, {});

          this.readyState = ReadyState.HEADERS_RECEIVED;
          xhr.onreadystatechange && xhr.onreadystatechange();
          this.readyState = ReadyState.LOADING;
          xhr.onreadystatechange && xhr.onreadystatechange();

          // 响应体
          let [, body] = bodyRows.split('\r\n');
          this.response = this.responseText = body;

          this.readyState = ReadyState.DONE;
          xhr.onreadystatechange && xhr.onreadystatechange();
          this.onload && this.onload();
        });
        socket.on('error', (err) => {
          this.onerror && this.onerror(err);
        });
      }
    ));

    this.readyState = ReadyState.OPENED;
    xhr.onreadystatechange && xhr.onreadystatechange();
  }
  getAllResponseHeaders() {
    let allResponseHeaders = '';
    for (let key in this.responseHeaders) {
      allResponseHeaders += `${key}: ${this.responseHeaders[key]}\r\n`;
    }
    return allResponseHeaders;
  }
  setRequestHeader(header, value) {
    this.headers[header] = value;
  }
  send() {
    let rows = [];
    // 按格式拼接
    rows.push(`${this.method} ${this.path} HTTP/1.1`);
    rows.push(...Object.keys(this.headers).map((key) => `${key}: ${this.headers[key]}`));
    this.socket.write(rows.join('\r\n') + '\r\n\r\n');
  }
}

let xhr = new XMLHttpRequest();
xhr.onreadystatechange = () => {
  console.log('onreadystatechange', xhr.readyState);
};
xhr.open('GET', 'http://127.0.0.1:8080/get');
xhr.responseType = 'text';
xhr.setRequestHeader('name', 'zhufeng');
xhr.setRequestHeader('age', '10');
xhr.onload = () => {
  console.log('readyState', xhr.readyState);
  console.log('status', xhr.status);
  console.log('statusText', xhr.statusText);
  console.log('getAllResponseHeaders', xhr.getAllResponseHeaders());
  console.log('response', xhr.response);
};
xhr.send();
