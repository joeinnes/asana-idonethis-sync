# Installation
1. `git clone https://github.com/joeinnes/asana-idonethis-sync.git && cd asana-idonethis-sync.git`
2. Run 'npm install'
3. Copy config.sample.js to config.js
4. Modify to add in your keys (instructions for finding keys in the file)

# Running
Run 'node index.js'. Because this needs to read from stdin, it can't be amped off or disowned.

The best way to get this running in the background is to run `screen` before `node index.js`, and then hit `Ctrl + A + D` to detach the session. Then you can exit out of your ssh session, or close the terminal.
