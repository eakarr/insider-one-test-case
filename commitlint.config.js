const imperativeVerbs = new Set([
  'add',
  'build',
  'configure',
  'create',
  'disable',
  'document',
  'enable',
  'establish',
  'fix',
  'implement',
  'improve',
  'move',
  'optimize',
  'prepare',
  'prevent',
  'preserve',
  'refactor',
  'register',
  'remove',
  'rename',
  'replace',
  'resolve',
  'revert',
  'simplify',
  'test',
  'update',
])

const subjectImperative = ({ subject }) => {
  const firstWord = subject?.trim().split(/\s+/)[0]
  const isImperative = firstWord ? imperativeVerbs.has(firstWord) : false

  return [
    isImperative,
    `subject must start with an approved lowercase imperative verb (${[...imperativeVerbs].join(', ')})`,
  ]
}

export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'subject-imperative': subjectImperative,
      },
    },
  ],
  rules: {
    'header-max-length': [2, 'always', 100],
    'subject-full-stop': [2, 'never', '.'],
    'subject-imperative': [2, 'always'],
  },
}
