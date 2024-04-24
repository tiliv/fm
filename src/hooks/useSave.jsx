import { useEffect } from 'react';
import * as Save from '../actions/Save';
import * as Load from '../actions/Load';

export default function useSave(slot, {...vars}) {
  useEffect(Save.save(slot, vars));
  useEffect(Load.load(slot, vars));
}
