grammar TinyDsl

// entry Document: 
//     (entities+=Entity)*;

// Entity:
//     'Entity' name=ID ;


entry Document:
    (entities+=Entity)*;

Entity:
    'Entity' name=ID '{'
        (members+=Member)*
    '}'
    ;

Member:
    Field | Connection
    ;

Field:
    Type name=ID
    ;

Type:
    dataType=('String' | 'Int' | 'Bool')
    ;

Connection:
    kind=Kind to=[Entity:ID] 'as' name=ID 
    ;

Kind:
    kindType = ('has' | 'consistOf' | 'partOf')
    ;

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
