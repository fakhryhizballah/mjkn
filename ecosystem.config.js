module.exports = {
    apps: [{
        name: "node-mjkn",
        script: "./app.js",
        watch: true,
        env: {
            NODE_ENV: "development",
        }
    }]
}