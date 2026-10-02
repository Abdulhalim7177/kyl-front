import os
f = 'src/App.tsx'
content = open(f, 'r', encoding='utf-8').read()

import_statement = "import DistrictsPage from '@/pages/DistrictsPage'"
if import_statement not in content:
    content = content.replace("import NotFound from '@/pages/NotFound'", "import NotFound from '@/pages/NotFound'\nimport DistrictsPage from '@/pages/DistrictsPage'")

routes_block = '''          <Route
            path="/k8s9d7f3-districts/states"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / Districts / States">
                  <DistrictsPage type="states" title="States" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/k8s9d7f3-districts/senatorial"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / Districts / Senatorial">
                  <DistrictsPage type="senatorial" title="Senatorial Districts" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/k8s9d7f3-districts/federal"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / Districts / Federal Constituencies">
                  <DistrictsPage type="federal" title="Federal Constituencies" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/k8s9d7f3-districts/state-house"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / Districts / State Constituencies">
                  <DistrictsPage type="state-house" title="State Constituencies" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/k8s9d7f3-districts/lgas"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / Districts / LGAs">
                  <DistrictsPage type="lgas" title="Local Government Areas" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/k8s9d7f3-districts/wards"
            element={
              <ProtectedRoute>
                <AdminLayout title="Admin / Districts / Wards">
                  <DistrictsPage type="wards" title="Wards" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />'''

content = content.replace('<Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />', routes_block)

open(f, 'w', encoding='utf-8').write(content)
print('App.tsx updated!')
