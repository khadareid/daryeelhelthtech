import { configureStore } from '@reduxjs/toolkit';  
import { authApi } from '../service/auth/authApi';
import { googleAuthApi } from '../service/auth/googleAuthApi';
import { usersApi } from '../service/users/UsersApi';
import { dashboardApi } from '../service/Dashboard/Dashboard';
import { notificationsApi } from '../service/notifications/NotificationsApi';
import userInfoSlice from '../service/auth/Userinfo';
import uiSlice from '@/components/ui/uiSlice';
import { dailyHealthLogApi } from '../service/DailyHealthLog/DailyHealthLog';
import { hospitalsApi } from '../service/hospitals/HospitalsApi';
import { appointmentsApi } from '../service/appointments/AppointmentsApi';
import { healthcareApi } from '../service/healthcare/HealthcareApi';
import { MessagesApi } from '../service/messages/MessagesApi';
import { adminApi } from '../service/admin/AdminApi';
import { newsApi } from '../service/news/NewsApi';
import { professionalsApi } from '../service/professionals/ProfessionalsApi';

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [googleAuthApi.reducerPath]: googleAuthApi.reducer,
    userInfo: userInfoSlice.reducer,
    ui: uiSlice.reducer,  
    [usersApi.reducerPath]: usersApi.reducer, 
    [dailyHealthLogApi.reducerPath]: dailyHealthLogApi.reducer, 
    [dashboardApi.reducerPath]: dashboardApi.reducer,  
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    [hospitalsApi.reducerPath]: hospitalsApi.reducer,
    [appointmentsApi.reducerPath]: appointmentsApi.reducer,
    [healthcareApi.reducerPath]: healthcareApi.reducer,
    [MessagesApi.reducerPath]: MessagesApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [newsApi.reducerPath]: newsApi.reducer,
    [professionalsApi.reducerPath]: professionalsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      googleAuthApi.middleware, 
      usersApi.middleware, 
      dailyHealthLogApi.middleware,
      dashboardApi.middleware, 
      notificationsApi.middleware,
      hospitalsApi.middleware,
      appointmentsApi.middleware,
      healthcareApi.middleware,
      MessagesApi.middleware,
      adminApi.middleware,
      newsApi.middleware,
      professionalsApi.middleware,
    ),
});
// done
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
