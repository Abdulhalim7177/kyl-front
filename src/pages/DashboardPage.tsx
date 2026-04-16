import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  HiUsers, 
  HiUserAdd,
  HiPencilAlt,
  HiDocumentText,
  HiTrash,
  HiNewspaper
} from "react-icons/hi";
import { 
  MdHowToVote, 
  MdPeople,
  MdTrendingUp 
} from "react-icons/md";
import { FaLandmark } from "react-icons/fa";

export default function DashboardPage() {
  const stats = [
    { label: "Users", value: "1293", change: "+12%", icon: HiUsers, color: "text-teal-600", bgColor: "bg-teal-50" },
    { label: "Political Parties", value: "12", change: "+12%", icon: FaLandmark, color: "text-blue-600", bgColor: "bg-blue-50" },
    { label: "Elections", value: "7", change: "+12%", icon: MdHowToVote, color: "text-purple-600", bgColor: "bg-purple-50" },
    { label: "Candidates", value: "123", change: "+12%", icon: MdPeople, color: "text-green-600", bgColor: "bg-green-50" },
  ];

  const recentCandidates = [
    { name: "Babajide Sanwo-Olu", party: "APC", position: "Governor", state: "Lagos", status: "Active" },
    { name: "Peter Obi", party: "LP", position: "President", state: "Anambra", status: "Active" },
    { name: "Atiku Abubakar", party: "PDP", position: "President", state: "Adamawa", status: "Pending" },
    { name: "Natasha Akpoti", party: "PDP", position: "Senator", state: "Kogi", status: "Active" },
    { name: "Seyi Makinde", party: "PDP", position: "Governor", state: "Oyo", status: "Inactive" },
  ];

  const recentActivity = [
    { 
      icon: HiUserAdd, 
      title: "Musa created new admin", 
      desc: "Added Musa Musa as Party Support Admin", 
      time: "2 minutes ago", 
      color: "text-teal-600",
      bgColor: "bg-teal-50"
    },
    { 
      icon: HiPencilAlt, 
      title: "Isa updated candidate", 
      desc: "Updated profile for 'Nihi Tinubu'", 
      time: "8 minutes ago", 
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    { 
      icon: HiDocumentText, 
      title: "Election list modified", 
      desc: "New legislative election added", 
      time: "12 minutes ago", 
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    { 
      icon: HiTrash, 
      title: "Position archived", 
      desc: "LGA Governor' was removed", 
      time: "1 hour ago", 
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    { 
      icon: HiNewspaper, 
      title: "New blog post published", 
      desc: "'Tinubu's promises for the 2027 campaign'", 
      time: "Yesterday", 
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      {/* Welcome Banner */}
      <Card className="shadow-md border border-gray-100 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Welcome Back, Aminu</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button className="bg-primary hover:bg-primary/90 shadow-sm w-full sm:w-auto">
                <HiUserAdd className="mr-2 h-4 w-4" />
                Add User
              </Button>
              <Button className="bg-primary hover:bg-primary/90 shadow-sm w-full sm:w-auto">
                <HiUserAdd className="mr-2 h-4 w-4" />
                Add Candidate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="shadow-md hover:shadow-lg transition-shadow border border-gray-100">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start justify-between mb-3 md:mb-4">
                  <div>
                    <p className="text-xs md:text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-2 md:p-3 rounded-lg`}>
                    <IconComponent className={`h-5 w-5 md:h-6 md:w-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs md:text-sm">
                  <MdTrendingUp className="text-green-600 h-4 w-4" />
                  <span className="text-green-600 font-medium">{stat.change}</span>
                  <span className="text-gray-500">from last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Candidates Table */}
      <Card className="shadow-md border border-gray-100">
        <CardHeader className="border-b border-gray-100 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base md:text-lg font-semibold">Recent Candidates</CardTitle>
            <Button variant="ghost" className="text-primary hover:text-primary/80 w-full sm:w-auto">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-gray-100">
                    <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">NAME</TableHead>
                    <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">PARTY</TableHead>
                    <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">POSITION</TableHead>
                    <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">STATE</TableHead>
                    <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">STATUS</TableHead>
                    <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCandidates.map((candidate, index) => (
                    <TableRow key={index} className="group transition-colors border-gray-50 hover:bg-gray-50/50">
                      <TableCell className="font-semibold text-gray-900 whitespace-nowrap">
                        {candidate.name}
                      </TableCell>
                      <TableCell className="text-gray-500 font-medium">{candidate.party}</TableCell>
                      <TableCell className="text-gray-500 font-medium">{candidate.position}</TableCell>
                      <TableCell className="font-medium text-gray-700">{candidate.state}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 font-semibold text-[0.8rem] whitespace-nowrap">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            candidate.status === 'Active' ? 'bg-emerald-500' : 
                            candidate.status === 'Pending' ? 'bg-amber-500' : 
                            'bg-gray-400'
                          }`}></span>
                          <span className={
                            candidate.status === 'Active' ? 'text-emerald-600' : 
                            candidate.status === 'Pending' ? 'text-amber-600' : 
                            'text-gray-500'
                          }>
                            {candidate.status}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <button className="text-[#146c4f] font-semibold text-xs hover:underline">
                          Edit
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Section: Recent Activity & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Activity */}
        <Card className="shadow-md border border-gray-100">
          <CardHeader className="border-b border-gray-100 p-4 md:p-6">
            <CardTitle className="text-base md:text-lg font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-3 md:space-y-4">
              {recentActivity.map((activity, index) => {
                const IconComponent = activity.icon;
                return (
                  <div key={index} className="flex gap-3 md:gap-4">
                    <div className={`w-9 h-9 md:w-10 md:h-10 rounded-lg ${activity.bgColor} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <IconComponent className={`h-4 w-4 md:h-5 md:w-5 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs md:text-sm text-gray-600 truncate">{activity.desc}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button variant="ghost" className="w-full mt-4 text-primary hover:text-primary/80 text-sm">
              View Full Logs
            </Button>
          </CardContent>
        </Card>

        {/* Registration Trends Chart */}
        <Card className="shadow-md border border-gray-100">
          <CardHeader className="border-b border-gray-100 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base md:text-lg font-semibold">Registration Trends</CardTitle>
                <p className="text-xs md:text-sm text-gray-500 mt-1">Monthly user vs candidate registrations</p>
              </div>
              <select className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs md:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto">
                <option>Last 6 Months</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="h-48 md:h-64 flex items-end justify-between gap-2 md:gap-4">
              {/* Simple bar chart representation */}
              <div className="flex-1 flex flex-col items-center">
                <div className="w-full bg-purple-200 rounded-t shadow-sm" style={{ height: "20%" }}></div>
                <span className="text-xs text-gray-500 mt-2">Jan</span>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className="w-full bg-purple-300 rounded-t shadow-sm" style={{ height: "35%" }}></div>
                <span className="text-xs text-gray-500 mt-2">Feb</span>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className="w-full bg-purple-400 rounded-t shadow-sm" style={{ height: "75%" }}></div>
                <span className="text-xs text-gray-500 mt-2">Mar</span>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className="w-full bg-purple-500 rounded-t shadow-sm" style={{ height: "85%" }}></div>
                <span className="text-xs text-gray-500 mt-2">Apr</span>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className="w-full bg-purple-400 rounded-t shadow-sm" style={{ height: "70%" }}></div>
                <span className="text-xs text-gray-500 mt-2">May</span>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className="w-full bg-purple-300 rounded-t shadow-sm" style={{ height: "65%" }}></div>
                <span className="text-xs text-gray-500 mt-2">Jun</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 md:gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-purple-400 shadow-sm"></div>
                <span className="text-xs md:text-sm text-gray-600">User</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-pink-300 shadow-sm"></div>
                <span className="text-xs md:text-sm text-gray-600">Candidate</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
