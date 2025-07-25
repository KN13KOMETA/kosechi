const server = require("http").createServer((req, res) => {
  res.statusCode = 200;
  res.end("Working!");
});

const port = Number(process.argv.find(v => v.startsWith("--port="))?.slice(7));

try {
  server.listen(port, () => console.log(`Listening on ${port}`));
} catch (_err) {
  console.log(`Port "${port}" is not available`);
}
