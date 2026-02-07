const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Log environment and build status
console.log('=== Server Starting ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Dev mode:', dev);
console.log('Working directory:', __dirname);
console.log(
    'BUILD_ID exists:',
    fs.existsSync(path.join(__dirname, '.next', 'BUILD_ID')),
);
if (fs.existsSync(path.join(__dirname, '.next', 'BUILD_ID'))) {
    console.log(
        'BUILD_ID:',
        fs
            .readFileSync(path.join(__dirname, '.next', 'BUILD_ID'), 'utf8')
            .trim(),
    );
}
console.log('======================');

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare()
    .then(() => {
        createServer(async (req, res) => {
            try {
                // Be sure to pass `true` as the second argument to `url.parse`.
                // This tells it to parse the query portion of the URL.
                const parsedUrl = parse(req.url, true);
                const { pathname, query } = parsedUrl;

                if (pathname === '/a') {
                    await app.render(req, res, '/a', query);
                } else if (pathname === '/b') {
                    await app.render(req, res, '/b', query);
                } else {
                    await handle(req, res, parsedUrl);
                }
            } catch (err) {
                console.error('Error occurred handling', req.url, err);
                res.statusCode = 500;
                res.end('internal server error');
            }
        }).listen(port, (err) => {
            if (err) throw err;
            console.log(`> Ready on http://${hostname}:${port}`);
        });
    })
    .catch((err) => {
        console.error('Failed to start server:', err);
        process.exit(1);
    });
