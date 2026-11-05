/*
 * Stand-in for components/CodeEditor in page tests: CodeMirror needs layout jsdom lacks, so the
 * stub is a plain textarea wired to the same value/onChange props.
 */
import { memo } from 'react';

interface StubProps {
  value: string;
  onChange?: (value: string) => void;
  mode: string;
}

function CodeEditorStub(props: Readonly<StubProps>) {
  return (
    <textarea
      aria-label={'code editor ' + props.mode}
      value={props.value}
      onChange={event => props.onChange?.(event.target.value)}
    />
  );
}

export default memo(CodeEditorStub);
