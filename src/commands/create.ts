import { prompt } from 'inquirer'
import { flatMap } from 'rxjs/operators'
import { resolve } from 'path'
import { logError } from '../utilities/log'
import { load } from 'npm'
import { generateCoreAngular } from '../generators/angular-core.gen'
import { mkDir_, pathExists_ } from '../utilities/rx-fs'
import { empty, forkJoin } from 'rxjs'
import generateGitIgnore from '../generators/gitignore.gen'
import generateTsLint from '../generators/tslint.gen'
import generateFngConfig from '../generators/config.gen'
import generatePackageFile from '../generators/package.gen'
import { command } from 'yargs'
import { ANGULAR_UNIVERSAL_DEPS, ANGULAR_UNIVERSAL_EXPRESS_DEPS } from '../generators/deps.const'

command('create', 'create a new application', (args) => {
  return args
}, (args) => {
  create()
})
interface newAppConfigRespinse {
  readonly fullname: string
  readonly shortname: string
}

function create() {
  console.log('Create an Angular application\n')
  prompt([
    {
      name: 'fullname',
      message: 'Application Full Name',
      default: 'fusing-angular-demo-app'
    },
    {
      name: 'shortname',
      message: 'Application Short Name',
      default: 'fusing-ng'
    },
    {
      name: 'appType',
      type: 'confirm',
      message: 'Server rendered (Angular Universal)?'
    },
    // {
    //   type: 'list',
    //   name: 'test-runner',
    //   message: 'Unit Test Runner',
    //   choices: [
    //     {
    //       name: 'Jest',
    //       value: 'jest'
    //     },
    //     {
    //       name: 'None'
    //     }
    //   ]
    // },
    // {
    //   type: 'list',
    //   name: 'test-runner',
    //   message: 'E2E Test Runner',
    //   choices: [
    //     {
    //       name: 'Nightmare',
    //       value: 'nightmare',
    //       checked: true
    //     },
    //     {
    //       name: 'None'
    //     }
    //   ]
    // },
    // {
    //   type: 'list',
    //   name: 'deployments',
    //   message: 'Deployment Infrastructure',
    //   choices: [
    //     {
    //       name: 'Heroku',
    //       value: 'heroku',
    //       checked: true
    //     },
    //     {
    //       name: 'AWS Serverless',
    //       value: 'aws',
    //       disabled: 'in development'
    //     },
    //     {
    //       name: 'Google Cloud Serverless',
    //       value: 'gcloud',
    //       disabled: 'in development'
    //     },
    //     {
    //       name: 'None',
    //       value: 'none'
    //     }
    //   ]
    // },
    // {
    //   type: 'checkbox',
    //   name: 'ide',
    //   message: 'IDE Configurations',
    //   choices: [
    //     {
    //       name: 'Visual Studio Code',
    //       value: 'vscode',
    //       checked: true
    //     },
    //     {
    //       name: 'Webstorm',
    //       value: 'webstorm',
    //       disabled: 'unavailable, in development'
    //     }
    //   ]
    // },
    // {
    //   name: 'ga',
    //   message: 'Include Google Analytics?',
    //   type: 'expand',
    //   choices: [
    //     {
    //       name: 'Yes',
    //       value: 'true',
    //       key: 'y'
    //     },
    //     {
    //       key: 'n',
    //       name: 'No',
    //       value: 'false'
    //     },
    //   ]
    // },
    // {
    //   type: 'list',
    //   name: 'ui-lib',
    //   message: 'UI Library',
    //   choices: [
    //     {
    //       name: 'Angular Material',
    //       value: 'material',
    //       checked: false
    //     },
    //     {
    //       name: 'Bootstrap',
    //       value: 'bootstrap',
    //       checked: false
    //     },
    //     {
    //       name: 'Bulma',
    //       value: 'bulma',
    //       checked: false
    //     },
    //     {
    //       name: 'None',
    //       value: 'none',
    //       checked: true
    //     }
    //   ]
    // },
    // {
    //   type: 'checkbox',
    //   name: 'build',
    //   message: 'Features',
    //   choices: [
    //     {
    //       name: 'Enable Progressive Web App (PWA)',
    //       value: 'pwa',
    //       checked: false
    //     }
    //   ]
    // },
    // {
    //   type: 'checkbox',
    //   name: 'packages',
    //   message: 'Additional Packages',
    //   choices: [
    //     {
    //       name: 'Angular Flex-Layout',
    //       value: 'flex-layout',
    //       checked: false
    //     },
    //     {
    //       name: 'Firebase',
    //       value: 'firebase',
    //       checked: false
    //     },
    //     {
    //       name: 'Angularytics2',
    //       value: 'angularytics2',
    //       checked: false
    //     }
    //   ]
    // }
  ])
    .then((res: newAppConfigRespinse) => {
      const path = resolve(res.fullname)
      pathExists_(path)
        .pipe(
          flatMap(exists => {
            if (exists) {
              logError(`An app already exists at ${path}`)
              return empty()
            } else {
              return mkDir_(resolve(res.fullname))
                .pipe(
                  flatMap(() => {
                    return generatePackageFile({
                      name: 'test',
                      dependencies: {
                        ...ANGULAR_UNIVERSAL_DEPS,
                        ...ANGULAR_UNIVERSAL_EXPRESS_DEPS
                      }
                    }, res.fullname)
                  }),
                  flatMap(() => forkJoin([
                    generateCoreAngular(res.fullname),
                    generateGitIgnore(path),
                    generateTsLint(path),
                    generateFngConfig(path)
                  ]))
                )
            }
          })
        )


        .subscribe((() => {
          load({
            global: false,
            prefix: res.fullname
          }, (err, npm) => {
            if (err) {
              logError(err.message)
            } else {
              // commands.install([res.fullname], (err) => {
              //   if (err) {
              //     logError(err.message)
              //   } else {
              //     // generateCoreAngular(res.fullname).subscribe()
              //   }
              // })
            }
          })
        }))
    })
    .catch(err => {
      logError(err)
      process.exit(0)
    })
}