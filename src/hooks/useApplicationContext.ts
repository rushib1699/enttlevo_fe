import { useContext } from 'react';
import { ApplicationContext } from '@/context/ApplicationContext';

export const useApplicationContext = () => useContext(ApplicationContext);