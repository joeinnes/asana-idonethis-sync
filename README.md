# Installation
1. Run 'npm install'
2. Copy config.sample.js to config.js
3. Modify to add in your keys

# Running
Run 'node index.js'. Because this needs to read from stdin, it can't be amped off or disowned.

The best way to get this running in the background is to run `screen` before `node index.js`, and then hit `Ctrl + A + D` to detach the session. Then you can exit out of your ssh session, or close the terminal.
