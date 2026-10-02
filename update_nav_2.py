import os

f = 'src/components/AdminLayout.tsx'
with open(f, 'r', encoding='utf-8') as file:
    content = file.read()

# 1. Add ChevronDown import
content = content.replace('Menu\n}', 'Menu,\n  ChevronDown\n}')

# 2. Update SIDEBAR_ITEMS
old_items = '''const SIDEBAR_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/k8s9d7f3-admin-panel' },
  { name: 'Users', icon: Users, path: '/k8s9d7f3-users' },
  { name: 'Candidates', icon: UserCheck, path: '/k8s9d7f3-candidates' },
  { name: 'Political Parties', icon: Flag, path: '/k8s9d7f3-parties' },
  { name: 'Elections', icon: Vote, path: '/k8s9d7f3-elections' },
  { name: 'Offices', icon: Building2, path: '#' },
  { name: 'Districts', icon: MapPin, path: '#' },
  { name: 'Elected Officials', icon: UserCheck, path: '#' },
  { name: 'Blogs', icon: FileText, path: '#' },
  { name: 'Activity Logs', icon: Activity, path: '/k8s9d7f3-activity-logs' },
]'''

new_items = '''const SIDEBAR_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/k8s9d7f3-admin-panel' },
  { name: 'Users', icon: Users, path: '/k8s9d7f3-users' },
  { name: 'Candidates', icon: UserCheck, path: '/k8s9d7f3-candidates' },
  { name: 'Political Parties', icon: Flag, path: '/k8s9d7f3-parties' },
  { name: 'Elections', icon: Vote, path: '/k8s9d7f3-elections' },
  { 
    name: 'Districts', 
    icon: MapPin, 
    path: '#',
    subItems: [
      { name: 'States', path: '/k8s9d7f3-districts/states' },
      { name: 'Senatorial Districts', path: '/k8s9d7f3-districts/senatorial' },
      { name: 'Federal Constituencies', path: '/k8s9d7f3-districts/federal' },
      { name: 'State Constituencies', path: '/k8s9d7f3-districts/state-house' },
      { name: 'LGAs', path: '/k8s9d7f3-districts/lgas' },
      { name: 'Wards', path: '/k8s9d7f3-districts/wards' },
    ]
  },
  { name: 'Blogs', icon: FileText, path: '#' },
  { name: 'Activity Logs', icon: Activity, path: '/k8s9d7f3-activity-logs' },
]'''

content = content.replace(old_items, new_items)

# 3. Update SidebarContent component definition to use brackets so we can use useState
old_sidebar_def = 'const SidebarContent = () => ('
new_sidebar_def = '''const SidebarContent = () => {
    const [openMenus, setOpenMenus] = useState<string[]>(['Districts'])
    const toggleMenu = (name: string) => {
      setOpenMenus(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
    }
    return ('''
content = content.replace(old_sidebar_def, new_sidebar_def)

# 4. Update the nav mapping block inside SidebarContent
old_nav_block = '''{SIDEBAR_ITEMS.map((item, index) => {
          const IconComponent = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link 
              key={index} 
              to={item.path} 
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${isActive ? 'bg-[#dcfce7]/50 text-[#146c4f]' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <IconComponent className={`w-5 h-5 mr-3 ${isActive ? 'text-[#146c4f]' : 'text-gray-400'}`} />
              {item.name}
            </Link>
          )
        })}'''

new_nav_block = '''{SIDEBAR_ITEMS.map((item, index) => {
          const IconComponent = item.icon
          const hasSubItems = item.subItems && item.subItems.length > 0
          const isMenuOpen = openMenus.includes(item.name)
          const isSubActive = hasSubItems && item.subItems?.some(sub => location.pathname.startsWith(sub.path))
          const isActive = location.pathname === item.path || isSubActive

          return (
            <div key={index} className="flex flex-col">
              {hasSubItems ? (
                <button 
                  onClick={() => toggleMenu(item.name)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-colors ${isActive || isMenuOpen ? 'bg-[#dcfce7]/20 text-[#146c4f]' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <div className="flex items-center">
                    <IconComponent className={`w-5 h-5 mr-3 ${isActive || isMenuOpen ? 'text-[#146c4f]' : 'text-gray-400'}`} />
                    {item.name}
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <Link 
                  to={item.path} 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${isActive ? 'bg-[#dcfce7]/50 text-[#146c4f]' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <IconComponent className={`w-5 h-5 mr-3 ${isActive ? 'text-[#146c4f]' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              )}
              
              {hasSubItems && isMenuOpen && (
                <div className="flex flex-col mt-1 ml-4 pl-4 border-l border-gray-200 space-y-1">
                  {item.subItems?.map((subItem, subIndex) => {
                    const isSubItemActive = location.pathname === subItem.path
                    return (
                      <Link
                        key={subIndex}
                        to={subItem.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${isSubItemActive ? 'text-[#146c4f] font-medium bg-[#dcfce7]/30' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                      >
                        {subItem.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}'''
content = content.replace(old_nav_block, new_nav_block)

# 5. Fix the end of SidebarContent
old_end = '''        <button 
          onClick={handleLogout} 
          className="p-2 text-gray-400 hover:text-red-500 transition-colors shrink-0"
        >
           <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  )'''

new_end = '''        <button 
          onClick={handleLogout} 
          className="p-2 text-gray-400 hover:text-red-500 transition-colors shrink-0"
        >
           <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
  }'''
content = content.replace(old_end, new_end)

with open(f, 'w', encoding='utf-8') as file:
    file.write(content)

print("Nav updated.")
