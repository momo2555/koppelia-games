
process.stdin.resume();
process.on('SIGINT', () => {
    console.log("SIGINT RECEIVED !!!!!!!!!!!!");
    process.exit(0);
});


const legendary = require("legendary");

legendary.run();