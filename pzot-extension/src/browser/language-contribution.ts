import { injectable, inject } from 'inversify';
import { Workspace, Languages, LanguageClientFactory, BaseLanguageClientContribution } from '@theia/languages/lib/browser';
declare var monaco: any

/**
* Registers the extension and the params for the PZot Language
*/
@injectable()
export class DslClientContribution extends BaseLanguageClientContribution {

    readonly id = "pzot";
    readonly name = "PZot";

    constructor(
        @inject(Workspace) protected readonly workspace: Workspace,
        @inject(Languages) protected readonly languages: Languages,
        @inject(LanguageClientFactory) protected readonly languageClientFactory: LanguageClientFactory
    ) {
        super(workspace, languages, languageClientFactory);
    }

    protected get globPatterns() {
        return [
            '**/*.pzot'
        ];
    }
}

// register language with monaco on first load
registerDSL();

/**
* Sets the params of the Monaco Editor for the PZot Language
*/
export function registerDSL() {  
    // initialize monaco
    monaco.languages.register({
        id: 'pzot',
        aliases: ['PZot', 'pzot'],
        extensions: ['.pzot'],
        mimetypes: ['text/pzot']
    })
    monaco.languages.setLanguageConfiguration('pzot', {
        comments: {
            lineComment: "//",
            blockComment: ['/*', '*/']
        },
        brackets: [['(', ')']],
        autoClosingPairs: [
            {
                open: '(',
                close: ')'
            }]
    })
    monaco.languages.setMonarchTokensProvider('pzot', <any>{
        // Set defaultToken to invalid to see what you do not tokenize yet
        // defaultToken: 'invalid',

        litteralFollows: [
            '(-P- ', '(-p- '
        ],

        operators: [
            '!!', '&&', '||', '->', '<->'
        ],

        binaryOperators: [
            '=', '<', '<=', '>', '>=', '+', '-'
        ],

        temporalOperators: [
            'until', 'since', 'release', 'trigger', 'next', 'yesterday', 'zeta'
        ],

        probabilisticOperators: [
            'zot-p', 'zot-cp'
        ],

        // keyword: [
        //     'FORMULA', 'DEPENDENCIES'
        // ],

        tempdep: [
            'dep', '&&'
        ],

        propop: [
            '<', '<=', '=', '>', '>='
        ],

        op2: [
            '->', '<->', 'until', 'since', 'release', 'trigger'
        ],

        opf: [ 'next', 'yesterday', 'alw', 'som', 'alwf', 'somf', 'alwp', 'somp'],

        opfn: [ 'futr', 'past', 'withinf', 'withinp', 'lasts', 'lasted'],

        // we include these common regular expressions
        symbols: /[=><!~?:&|+\-*\/\^%]+/,
        escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

        // The main tokenizer for our languages
        // The main tokenizer for our languages
        tokenizer: {
            root: [
                // identifiers and keywords
                [/[a-z_$][\w$]*/, {
                    cases: {
                        '@temporalOperators': 'keyword',
                        '@probabilisticOperators': 'keyword',
                        '@opf': 'keyword',
                        '@opfn': 'keyword',
                        '@tempdep': 'keyword',
                        '@default': 'identifier'
                    }
                }],
                [/\(-p-\s\w*\)/, 'type.identifier'],  // to show class names nicely

                // whitespace
                { include: '@whitespace' },

                // delimiters and operators
                [/[()]/, '@brackets'],
                [/[<>](?!@symbols)/, '@brackets'],
                [/@symbols/, {
                    cases: {
                        '@operators': 'operator',
                        '@default': ''
                    }
                }]
            ],

            whitespace: [
                [/[ \t\r\n]+/, 'white'],
                [/\/\*/, 'comment', '@comment'],
                [/\/\/.*$/, 'comment'],
            ],

            comment: [
                [/[^\/*]+/, 'comment'],
                [/\/\*/, 'comment.invalid'],
                ["\\*/", 'comment', '@pop'],
                [/[\/*]/, 'comment']
            ],

            string: [
                [/[^\\"]+/, 'string'],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid'],
                [/"/, 'string', '@pop']
            ],
        },
    })
    monaco.languages.registerCompletionItemProvider('pzot', {
        provideCompletionItems: () => {
            return [
                
                {
                    label: 'next',
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: {
                        value: '(next ${1:condition})'
                    }
                }, 
                {
                    label: 'yesterday',
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: {
                        value: '(yesterday ${1:condition})'
                    }
                }, 
                {
                    label: 'alw',
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: {
                        value: '(alw ${1:condition})'
                    }
                }, 
                {
                    label: 'som',
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: {
                        value: '(som ${1:condition})'
                    }
                }, 
                {
                    label: 'alwf',
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: {
                        value: '(alwf ${1:condition})'
                    }
                }, 
                {
                    label: 'somf',
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: {
                        value: '(somf ${1:condition})'
                    }
                }, 
                {
                    label: 'alwp',
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: {
                        value: '(alwp ${1:condition})'
                    }
                }, 
                {
                    label: 'somp',
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: {
                        value: '(somp ${1:condition})'
                    }
                }, 
                {
                    label: 'and',
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: {
                        value: '(&& ${1:condition} ${2:condition})'
                    }
                },
                {
                    label: 'or',
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: {
                        value: '(|| ${1:condition} ${2:condition})'
                    }
                },
                {
                    label: 'not',
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: {
                        value: '(!! ${1:condition} ${2:condition})'
                    }
                },
                {
                    label: 'until',
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: {
                        value: '(until ${1:condition} ${2:condition})'
                    }
                }, 
                {
                    label: 'since',
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: {
                        value: '(since ${1:condition} ${2:condition})'
                    }        }, 
                {
                    label: 'release',
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: {
                        value: '(release ${1:condition} ${2:condition})'
                    }}, 
                {
                    label: 'trigger',
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: {
                        value: '(trigger ${1:condition} ${2:condition})'
                    }},                 
                    {
                        label: 'futr',
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: {
                            value: '(futr ${1:condition} ${2:condition})'
                        }
                    },
                    {
                        label: 'past',
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: {
                            value: '(past ${1:condition} ${2:condition})'
                        }
                    },  
                    {
                        label: 'withinf',
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: {
                            value: '(withinf ${1:condition} ${2:condition})'
                        }
                    },  
                    {
                        label: 'withinp',
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: {
                            value: '(withinp ${1:condition} ${2:condition})'
                        }
                    },  
                    {
                        label: 'lasts',
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: {
                            value: '(lasts ${1:condition} ${2:condition})'
                        }
                    },  
                    {
                        label: 'lasted',
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: {
                            value: '(lasted ${1:condition} ${2:condition})'
                        }
                    },   
                    {
                    label: 'litteral',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: {
                        value: '(-p- ${1:condition})'
                    },
                    documentation: 'Adds a new litteral'
                },

            ]
        }
    })
}