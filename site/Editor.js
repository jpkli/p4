// import ace from 'ace-builds';
// import 'ace-builds/src-noconflict/mode-json';
// import 'ace-builds/webpack-resolver';
// import 'ace-builds/src-noconflict/ext-language_tools';

export default function Editor ({containerId, dataAttributes}) {
  let langTools = ace.require('ace/ext/language_tools');
  let editor = ace.edit(containerId);
  editor.setTheme('ace/theme/chrome');
  editor.getSession().setMode('ace/mode/json');
  editor.getSession().setUseWrapMode(true);
  editor.setOptions({
    tabSize: 2,
    fontSize: '12pt',
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true
  })

  if (dataAttributes !== undefined) {
    let attrCompleter = {
      getCompletions: (editor, session, pos, prefix, callback) => {
          let wordList = dataAttributes
          callback(null, wordList.map(function(word) {
              return {
                  caption: word,
                  value: word,
                  meta: "attribute"
              }
          }));
      }
    }
    langTools.addCompleter(attrCompleter);
  
    editor.$blockScrolling = Infinity;
  }
  return editor;
}
