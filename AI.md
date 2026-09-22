# AI usage

## What I delegated

Project and configuration setup. Playwright configuration, splitting into two projects, ESLint, Prettier, and a strict `tsconfig`.
Converting the published OpenAPI schema into Zod schemas. The Partner API provides an `/api/public/v1/openapi.json` file; I set up schema generation in the `tests/api/schemas/` directory. This is a routine task—prone to error if done manually, yet easy to verify against the specification.
DOM exploration. Instead of inspecting elements via DevTools, I wrote temporary test scripts to output the exact data I needed. The resulting data was then incorporated into the Page Object. Bug analysis and verification via API. For each suspected defect, I used a short `curl` command to either confirm or rule out the issue.

## What I rewrote or corrected by hand

Initially, all tests were written with locators embedded directly in the files, without using the Page Object pattern. I then tasked an AI with creating a Page Object and extracting all the locators and methods into it.
The `happy path` test also looked slightly different; it lacked a step to confirm the record after all the necessary information had been entered. The objective was to study the API, find a way to perform a teardown—deleting the record after its creation—and add these subsequent steps to the test.

## Specific errors I noticed

The model wrote `phone: '+380501234567'` as test data.The field is masked as `+38 (0XX) XXX-XXXX` and keeps only the first ten digits it receives, so the form actually submitted `+38 (380) 501-2345` - operator code "380", number "501-2345". **The test stayed green the whole time**, because nothing asserted what was in the field; the appointment was created with a phone nobody could call.

I found BUG-2: Nine digits leaves submission disabled, but
`9999999999` enables it, so length is validated and the operator code is not.
