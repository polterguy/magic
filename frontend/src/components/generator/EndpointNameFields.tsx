import Select from '../Select';

/*
 * The verb, module and endpoint name inputs every endpoint generator starts its toolbar with.
 */
export default function EndpointNameFields(
  props: Readonly<{
    verbs: string[];
    verb: string;
    onVerb: (verb: string) => void;
    moduleName: string;
    onModuleName: (name: string) => void;
    endpointName: string;
    onEndpointName: (name: string) => void;
  }>,
) {
  return (
    <>
      <Select value={props.verb} onChange={value => props.onVerb(value)}>
        {props.verbs.map(option => (
          <option key={option} value={option}>
            {option.toUpperCase()}
          </option>
        ))}
      </Select>
      <input
        type="text"
        placeholder="Module name…"
        value={props.moduleName}
        onChange={e => props.onModuleName(e.target.value)}
        style={{ width: 150 }}
      />
      <input
        type="text"
        placeholder="Endpoint name…"
        value={props.endpointName}
        onChange={e => props.onEndpointName(e.target.value)}
        style={{ width: 150 }}
      />
    </>
  );
}
