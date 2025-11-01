import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Shield,
  Mail,
  Calendar,
  Users,
  UserCheck,
  UserX,
  Crown,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Users Management - Hayah-AI Admin',
  description: 'Manage user accounts, roles, and permissions',
}

// Mock users data
const mockUsers = [
  {
    id: '1',
    name: 'John Developer',
    email: 'john@developer.com',
    role: 'admin',
    status: 'active',
    avatar: null,
    createdAt: '2025-09-15T10:00:00Z',
    lastLoginAt: '2025-09-29T08:30:00Z',
    postsCount: 0,
    commentsCount: 5,
    isEmailVerified: true
  },
  {
    id: '2',
    name: 'Sarah Content',
    email: 'sarah@content.com',
    role: 'editor',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b647?w=64&h=64&fit=crop&crop=face',
    createdAt: '2025-09-20T14:20:00Z',
    lastLoginAt: '2025-09-28T16:45:00Z',
    postsCount: 3,
    commentsCount: 12,
    isEmailVerified: true
  },
  {
    id: '3',
    name: 'Mike Reader',
    email: 'mike@reader.com',
    role: 'subscriber',
    status: 'active',
    avatar: null,
    createdAt: '2025-09-22T09:15:00Z',
    lastLoginAt: '2025-09-29T12:20:00Z',
    postsCount: 0,
    commentsCount: 8,
    isEmailVerified: true
  },
  {
    id: '4',
    name: 'Lisa Writer',
    email: 'lisa@writer.com',
    role: 'author',
    status: 'inactive',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face',
    createdAt: '2025-09-18T11:30:00Z',
    lastLoginAt: '2025-09-25T14:10:00Z',
    postsCount: 7,
    commentsCount: 3,
    isEmailVerified: false
  },
  {
    id: '5',
    name: 'Alex Visitor',
    email: 'alex@visitor.com',
    role: 'subscriber',
    status: 'pending',
    avatar: null,
    createdAt: '2025-09-28T16:45:00Z',
    lastLoginAt: null,
    postsCount: 0,
    commentsCount: 0,
    isEmailVerified: false
  }
]

export default function UsersManagementPage() {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-te-soft-lavender" />
      case 'editor':
        return <Shield className="h-4 w-4 text-te-vibrant-coral" />
      case 'author':
        return <Edit className="h-4 w-4 text-te-bright-green" />
      case 'subscriber':
        return <User className="h-4 w-4 text-te-sage" />
      default:
        return <User className="h-4 w-4 text-te-sage" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-te-soft-lavender/10 text-te-soft-lavender border border-te-soft-lavender/20'
      case 'editor':
        return 'bg-te-vibrant-coral/10 text-te-vibrant-coral border border-te-vibrant-coral/20'
      case 'author':
        return 'bg-te-bright-green/10 text-te-bright-green border border-te-bright-green/20'
      case 'subscriber':
        return 'bg-te-sage/10 text-te-sage border border-te-sage/20'
      default:
        return 'bg-te-sage/10 text-te-sage border border-te-sage/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <UserCheck className="h-4 w-4 text-te-bright-green" />
      case 'inactive':
        return <UserX className="h-4 w-4 text-te-sage" />
      case 'pending':
        return <Calendar className="h-4 w-4 text-te-warm-gold" />
      default:
        return <User className="h-4 w-4 text-te-sage" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-te-bright-green/10 text-te-bright-green border border-te-bright-green/20'
      case 'inactive':
        return 'bg-te-sage/10 text-te-sage border border-te-sage/20'
      case 'pending':
        return 'bg-te-warm-gold/10 text-te-warm-gold border border-te-warm-gold/20'
      default:
        return 'bg-te-sage/10 text-te-sage border border-te-sage/20'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-te-deep-teal">Users</h1>
          <p className="text-te-sage">
            Manage user accounts, roles, and permissions.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/users/new">
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="metric-card-te bg-te-pearl border-te-vibrant-coral">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-te-sage">Total Users</p>
              <p className="text-2xl font-bold text-te-charcoal">{mockUsers.length}</p>
            </div>
            <Users className="h-8 w-8 text-te-vibrant-coral" />
          </div>
        </div>
        <div className="metric-card-te bg-te-pearl border-te-bright-green">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-te-sage">Active Users</p>
              <p className="text-2xl font-bold text-te-charcoal">
                {mockUsers.filter(u => u.status === 'active').length}
              </p>
            </div>
            <UserCheck className="h-8 w-8 text-te-bright-green" />
          </div>
        </div>
        <div className="metric-card-te bg-te-pearl border-te-warm-gold">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-te-sage">Pending</p>
              <p className="text-2xl font-bold text-te-charcoal">
                {mockUsers.filter(u => u.status === 'pending').length}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-te-warm-gold" />
          </div>
        </div>
        <div className="metric-card-te bg-te-pearl border-te-soft-lavender">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-te-sage">Admins</p>
              <p className="text-2xl font-bold text-te-charcoal">
                {mockUsers.filter(u => u.role === 'admin').length}
              </p>
            </div>
            <Crown className="h-8 w-8 text-te-soft-lavender" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-te-sage" />
          <input
            type="text"
            placeholder="Search users..."
            className="input-te pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
        <select className="input-te">
          <option>All Roles</option>
          <option>Admin</option>
          <option>Editor</option>
          <option>Author</option>
          <option>Subscriber</option>
        </select>
        <select className="input-te">
          <option>All Status</option>
          <option>Active</option>
          <option>Inactive</option>
          <option>Pending</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="card-te bg-te-pearl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-te-sage/20 bg-te-sage/10">
              <tr>
                <th className="text-left p-4 font-medium text-te-charcoal">User</th>
                <th className="text-left p-4 font-medium text-te-charcoal">Role</th>
                <th className="text-left p-4 font-medium text-te-charcoal">Status</th>
                <th className="text-left p-4 font-medium text-te-charcoal">Activity</th>
                <th className="text-left p-4 font-medium text-te-charcoal">Joined</th>
                <th className="text-right p-4 font-medium text-te-charcoal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockUsers.map((user) => (
                <tr key={user.id} className="border-b border-te-sage/20 hover:bg-te-sage/10 transition-colors duration-200">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-te-vibrant-coral/10 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-te-vibrant-coral" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-te-charcoal">{user.name}</div>
                        <div className="text-sm text-te-sage flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                          {!user.isEmailVerified && (
                            <span className="text-xs bg-te-vibrant-coral/10 text-te-vibrant-coral border border-te-vibrant-coral/20 px-1.5 py-0.5 rounded">
                              Unverified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(user.role)}
                      <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(user.status)}
                      <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <div className="flex items-center gap-4 text-te-sage">
                        <span>{user.postsCount} posts</span>
                        <span>{user.commentsCount} comments</span>
                      </div>
                      <div className="text-xs text-te-sage mt-1">
                        {user.lastLoginAt ? `Last: ${formatDate(user.lastLoginAt)}` : 'Never logged in'}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-te-charcoal">
                      <div>{formatDate(user.createdAt)}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/users/${user.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-te-sage">
          Showing 1-{mockUsers.length} of {mockUsers.length} users
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}