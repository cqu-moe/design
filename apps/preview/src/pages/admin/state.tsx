import { createContext, useContext, useState, type Dispatch, type SetStateAction } from 'react';
import { Outlet } from 'react-router';
import { initialUsers, initialClients, type DemoUser, type DemoClient } from '../../admin-data';
type AdminState = {
  users: DemoUser[];
  setUsers: Dispatch<SetStateAction<DemoUser[]>>;
  clients: DemoClient[];
  setClients: Dispatch<SetStateAction<DemoClient[]>>;
};
const Context = createContext<AdminState | null>(null);
export function AdminLayout() {
  const [users, setUsers] = useState(initialUsers);
  const [clients, setClients] = useState(initialClients);
  return (
    <Context.Provider value={{ users, setUsers, clients, setClients }}>
      <Outlet />
    </Context.Provider>
  );
}
export function useAdminData() {
  const value = useContext(Context);
  if (!value) throw new Error('Admin pages require AdminLayout');
  return value;
}
