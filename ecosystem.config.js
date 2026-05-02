module.exports = {
    apps: [{
        name: "node-mjkn",
        script: "./index.js",
        watch: true,
        env: {
            NODE_ENV: "development",
        }
    }]
}