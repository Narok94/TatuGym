import { useCallback,useEffect,useState } from 'react';
import type { SetStateAction } from 'react';
import type { AppData } from './types';
import { LEGACY_STUDENT_KEY,viewStudent,updateStudent,persistenceError } from './persistence';
export const STORAGE_KEY=LEGACY_STUDENT_KEY;
export const localDate=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const uid=()=>crypto.randomUUID();
export function useAppData() {
  const [data,setState]=useState(viewStudent);
  const [storageError,setError]=useState(persistenceError());
  useEffect(()=>{const changed=()=>{setState(viewStudent());setError(persistenceError());};window.addEventListener('forja:data',changed);return()=>window.removeEventListener('forja:data',changed);},[]);
  const setData=useCallback((action:SetStateAction<AppData>)=>{
    const current=viewStudent();
    const next=typeof action==='function'?action(current):action;
    if(next!==current) {updateStudent(next);setState(next);}
  },[]);
  return {data,setData,storageError};
}
