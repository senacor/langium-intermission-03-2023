grammar TinyDsl


entry Document:
    (imports+=Import)*

    (entities+=Entity)*;

Import:
    'import' path=STRING 'as' id=ID
    ;

Entity:
    'Entity' name=ID '{'
        (members+=Member)*
    '}'
    ;

Member returns Member:
    Field | Connection
    ;
interface Member extends NamedElement {}

Field:
    type=Type name=ID
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

NamedElement returns NamedElement:
    Entity | Member
    ;
interface NamedElement { name: string }

// QualifiedName returns string:
//     ID ('.' ID)*
//     ;


hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
