# dcp-badger

> Generate fancy-shmancy completion grids for your [DailyCodingProblem][] repository

Shamelessly copied from the GitHub profile activity grid.

## Example

![caseyWebb's DailyCodingProblem completion][my-grid]

## Usage

Include an image with the `src` attribute set to an instance of this app with a query param specifying the repo to check, similar to most README badges...

```markdown
![](https://apps.caseywebb.xyz/dcp-badger?repo=caseyWebb/dcp)
```

By default, files are expected to exist in the repo under `/<year>/<month>/<day>.ext`.

If you desire you may use a custom directory structure, so long as the date is in some way inferrable. In order to tell dcp-badger how to parse the file names, you must supply the `regex` parameter. See below for more information.

## Configuration

All params are passed via querystring

### repo [required]

Specify the (GitHub) repository to generate a grid for. Currently, the GitHub API is used, and not a git clone, so only public GitHub repos are supported.

example: `repo=caseyWebb/dcp`

### ref

The git ref (branch, tag, etc.) to use.

Defaults to `master`

### regex

A regular expression with `year`, `month`, and `day` [named capture groups](https://github.com/tc39/proposal-regexp-named-groups). For matching source files to days.

For example, if instead of the default `<year>/<month>/<day>.ext`, if you wanted to use a flat file structure and name your files `<year>-<month>-<day>.ext`, you could set the `regex` parameter to `(?<year>\\d{4})-(?<month>\\d+)-(?<day>\\d+)\\.ext`. Flex those regex muscles.

Defaults to `(?<year>\\d{4})/(?<month>\\d+)/(?<day>\\d+)\\.<EXT>` (see `ext` param below)

### ext

Solve the problems in multiple languages, and want to generate separate grids? Me too!

If `<EXT>` exists in the regex string (which it does by default), the value of the `ext` param will be substituted.

Defaults to `.+` (any)

### labelColor

Color to use for the grid labels

Defaults to `#767676`

### completeColor

Color to use for completed days

Defaults to `#7bc96f`

### incompleteColor

Color to use for incomplete days

Defaults to `#ebedf0`

### futureColor

Color to use for days in the future

Defaults to `rgba(0,0,0,0)`


[DailyCodingProblem]: https://dailycodingproblem.com
[my-grid]: https://apps.caseywebb.xyz/dcp-badger?repo=caseyWebb/dcp
