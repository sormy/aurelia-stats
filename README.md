# aurelia-stats #

Plugin aurelia-stats provides digest cycle statistics for Aurelia applications.

Plugin allow to measure duration and size of loops:

- Dirty Checker
- Micro Task
- Regular Task

Expected to be used only in browser environment and only for debug purposes.

## Get Started ##

1. Install aurelia-stats:

  ```bash
  jspm install aurelia-stats --dev
  ```
  
2. Use the plugin in your app's main.js:

  ```javascript
  export function configure(aurelia) {
    aurelia.use
      .standardConfiguration()
      .developmentLogging();
   
    aurelia.use.plugin('aurelia-stats');
    // or
    //aurelia.use.plugin('aurelia-stats', options);

    aurelia.start().then(() => aurelia.setRoot());
  }
  ```
  
3. Include plugin's CSS in your app's index.html:
  
  ```css
  <link rel="stylesheet" href="jspm_packages/github/sormy/aurelia-stats@1.0.0/aurelia-stats.css">
  ```

## Syntax ##

- **DC**: Dirty Checker Loop, *X / Y ms*
  - X: max number of dirty checked properties during measurement interval
  - Y: duration of dirty checker loop during measurement interval
- **MT**: Micro Task Loop, *X / Y ms*
  - X: total number of micro tasks flushed during measurement interval
  - Y: duration of micro task loop during measurement interval
- **RT**: Regular Task Loop, *X / Y ms*
  - X: total number of regular tasks flushed during measurement interval
  - Y: duration of regular task loop during measurement interval
- **SUM**: Summary, *X% / Y ms*
  - X: how much time framework spend on processing of all loops relative to measurement interval
  - Y: duration of all loops during measurement interval

## Configuration ##

Plugin options could be passsed like below:

  ```javascript
  aurelia.use.plugin('aurelia-stats', {
    threshold: 100,
    interval: 1000,
    warnLevel: 0.6,
    debugDirtyChecker: false
  });
  ```

Available options are:

- **threshold**: Max critical duration of digest loop, defaults to 100 ms.
- **interval**: Update interval, ms, defaults to 1000 ms.
- **warnLevel**: Warning level relative to threshold, from 0 to 1, defaults to 0.6.
- **debugDirtyChecker**: Debug dirty checked properties, defaults to false.

## Style ##

Plugin can be styled via CSS.

By default stats sticked to left top corner, but that could be changed, for example, like below:

  ```css
  .au-stats {
    left: auto;
    right: 0;
  }
  ```

## Platform Support ##

This library can be used in the **browser** only.

## Building The Code ##

To build the code, follow these steps.

1. Ensure that [NodeJS](http://nodejs.org/) is installed. This provides the platform on which the build tooling runs.

2. From the project folder, execute the following command:

  ```shell
  npm install
  ```
  
3. Ensure that [Gulp](http://gulpjs.com/) is installed. If you need to install it, use the following command:

  ```shell
  npm install -g gulp
  ```
  
4. To build the code, you can now run:

  ```shell
  gulp build
  ```
  
5. You will find the compiled code in the `dist` folder, available in three module formats: AMD, CommonJS and ES6.
