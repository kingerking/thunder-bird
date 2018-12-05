# ⛈thunder-bird🦅
**Unleash your *Node.js* thunder!!**

<!-- ### Description
Thunder Bird is the leading Node.js script execution tool and background script scheduler. Unleash your talent with thunder bird to create automated server scripts and super 🌱seed your general development experience and happiness. No more messing around with project configuration and messy file structures, Write once then, Thunder Bird can do the nitty gritty crap for you and let you focus on writing the code. easily manage demon processes and easily execute scripts and projects all in one command line interface. -->

### What it does
Thunder bird makes writing algorthims and node script utilities easy as cake!
You simply make a thunder bird command and link it to a file then execute that file anywhere!

### Use cases
Thunder bird fits in alot of workflows. Server automation(writing scripts for common tasks), debugging(write scripts for filtering output, counting files, etc..), Full fledge commands. Thunder bird is pretty much a "build your own" command line interface. 

### Getting started
Thunder bird is acually really simple and easy to use. 
you simply run `tb create <name> <file to run>` or `thunder-bird create <name> <file to run>`, to create/link your commands to a script / npm module project that exists locally on your computer. 
To run your files simple do: `tb <name> <parameters to pass to your scirpt>` or `tb run <name> <parameters>`
#### Hello world example
1. Create the following file.
**~/test.js**
````
#!/usr/bin/env node
console.log("Hello world test, my current working directory is: ", process.cwd());
````
2. run `tb create testScript ./test.js`
3. Execute it anywhere! by typing `tb testScript` or `tb run testScript`

#### Commands
1. `create` Creates a thunder-bird command(example: `tb create <your command name> <your script>`).
2. `remove` Removes a thunder-bird command(example: `tb remove <your command name>`).
3. `update-path` Updates the path to your script(example: `tb update-path <your command name> <script path>`).
4. `update-name` Updates your commands name(example: `tb update-name <your command name> <new name>`).
5. `run` Runs one of your commands(See Hello world example).
6. `tb --help` Note that additional documentation on this CLI is integrated directlyUpd into the --help command.

#### Contributing
I am welcoming people to come contribute to this project if they wish too. As of writing this i have not tested this utility on windows, Please open an issue for feature requests, errors and support bugs.