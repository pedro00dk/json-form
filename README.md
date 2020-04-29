# JSON Form

Create custom forms from json or yaml files.

### Features

-   Markdown support
-   Free style question layout
-   Video support
-   Session elapsed time collection
-   Distributed form session order based on previous submissions
-   Four answer types: shot text, long text, multi-choice, likert

### How to use

1. Create a google firebase project and enable cloud firebase (native mode) and cloud functions.
2. Clone this project
3. Run the following commands:
    - `npm run firebase-login` # login into your google account
    - `npm run firebase-init` # initialize your firebase project configuration
    -   - enable `Functions` options # The project is already initialized, this is needed only to chose the firebase project
    -   - Select `Use an existing project` and choose your project
    -   - Skip all override requests when the cli requests.
    - `npm run firebase-deploy` # deploy the functions and firestore configuration

After finishing the deploy, your database will be ready to receive form submissions.
The submissions can be accessed in the `storage` menu.

### Creating a form

The `gist.github` tool is recommended to store the json form specification.

The [json schema file](/schema/schema.json) can be used to make easier to build the specification.
