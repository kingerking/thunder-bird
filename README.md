#thunder-bird
### What it does
Thunder bird makes writing algorthims and node script utilities easy as cake!
You simply make a thunder bird command and link it to a file then execute that file anywhere!

### Getting started
Thunder bird is acually really simple and easy to use. 
you simply run `tb create <name> <file to run>` or `thunder-bird create <name> <file to run>`. 
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

#### Contributing
I am welcoming people to come contribute to this project if they wish too. As of writing this i have not tested this utility on windows, Please open an issue for feature requests, errors and support bugs.