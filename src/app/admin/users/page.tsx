
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { fetchUsers, type UserData } from '@/lib/data';
import { MoreHorizontal, Trash2, Search, Mail, Phone, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


export default function AllUsersPage() {
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();

  const refreshData = async () => {
    setLoading(true);
    const fetchedUsers = await fetchUsers();
    setAllUsers(fetchedUsers);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, "users", userId));
      toast({ title: 'User Deleted' });
      refreshData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete user.' });
    }
  };

  const sortedUsers = useMemo(() => {
    const sortableUsers = [...allUsers];
    switch (filter) {
        case 'active':
            return sortableUsers.sort((a, b) => (b.lastLogin?.seconds || 0) - (a.lastLogin?.seconds || 0)).slice(0, 50);
        case 'inactive':
            return sortableUsers.sort((a, b) => (a.lastLogin?.seconds || 0) - (b.lastLogin?.seconds || 0)).slice(0, 50);
        default:
            return sortableUsers.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
    }
  }, [allUsers, filter]);

  const filteredUsers = useMemo(() => sortedUsers.filter(u => (u.fullName || '').toLowerCase().includes(userSearch.toLowerCase()) || (u.email || '').toLowerCase().includes(userSearch.toLowerCase())), [sortedUsers, userSearch]);

  const handleEmailAll = () => {
    const emails = filteredUsers.map(u => u.email).join(',');
    if (emails) {
      window.location.href = `mailto:${emails}`;
    } else {
      toast({ title: 'No users to email' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4">Loading Users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-tight text-foreground flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          User Management
        </h1>
        <p className="mt-1 text-lg text-muted-foreground">
          Oversee all registered user accounts.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
          <CardDescription>Manage, view, and interact with all users on the platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={filter} onValueChange={setFilter}>
             <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Top 50 Active</TabsTrigger>
                <TabsTrigger value="inactive">Top 50 Inactive</TabsTrigger>
            </TabsList>
             <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by name or email..." className="pl-10" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                </div>
                <Button onClick={handleEmailAll}><Mail className="mr-2 h-4 w-4" />Email All Visible</Button>
            </div>
            <div className="border rounded-md">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="hidden sm:table-cell">Registered</TableHead>
                    <TableHead className="hidden md:table-cell">Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                        <TableCell className="font-medium">
                            <div className="flex flex-col">
                                <span className="font-semibold">{user.fullName}</span>
                                <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteUser(user.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /><span>Delete User</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    ))
                    ) : (
                    <TableRow><TableCell colSpan={4} className="h-24 text-center">No users found.</TableCell></TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
