import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'pages/login_page.dart';
import 'firebase_options.dart';
import 'pages/chat_page.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await dotenv.load(fileName: ".env");
    if (kIsWeb) {
      await Firebase.initializeApp(
        options: FirebaseOptions(
          apiKey: dotenv.env['FIREBASE_API_KEY']!,
          appId: dotenv.env['FIREBASE_APP_ID']!,
          messagingSenderId: dotenv.env['FIREBASE_MESSAGING_SENDER_ID']!,
          projectId: dotenv.env['FIREBASE_PROJECT_ID']!,
          authDomain: dotenv.env['FIREBASE_AUTH_DOMAIN']!,
          databaseURL: dotenv.env['FIREBASE_DATABASE_URL']!,
          storageBucket: dotenv.env['FIREBASE_STORAGE_BUCKET']!,
        ),
      );
    } else {
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );
    }
  } catch (e) {
    print('Error initializing Firebase: $e');
  }
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  final ValueNotifier<ThemeMode> _themeMode = ValueNotifier(ThemeMode.dark);
  final ValueNotifier<double> _fontSize = ValueNotifier(11.0);

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: Size(360, 690),
      builder: (context, child) => ValueListenableBuilder2<ThemeMode, double>(
        first: _themeMode,
        second: _fontSize,
        builder: (context, themeMode, fontSize, child) {
          return MaterialApp(
            title: kIsWeb ? 'Project Placement' : 'Cdc Fuckerrr',
            theme: ThemeData(
              brightness: Brightness.light,
              colorScheme: ColorScheme.fromSeed(
                seedColor: Colors.deepPurple,
                brightness: Brightness.light,
              ),
              useMaterial3: true,
            ),
            darkTheme: ThemeData(
              brightness: Brightness.dark,
              colorScheme: ColorScheme.fromSeed(
                seedColor: Colors.deepPurple,
                brightness: Brightness.dark,
              ),
              useMaterial3: true,
            ),
            themeMode: themeMode,
            home: AuthWrapper(
              themeModeNotifier: _themeMode,
              fontSizeNotifier: _fontSize,
            ),
          );
        },
      ),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  final ValueNotifier<ThemeMode> themeModeNotifier;
  final ValueNotifier<double> fontSizeNotifier;

  AuthWrapper(
      {required this.themeModeNotifier, required this.fontSizeNotifier});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.active) {
          User? user = snapshot.data;
          if (user == null) {
            return LoginPage(
              themeModeNotifier: themeModeNotifier,
              fontSizeNotifier: fontSizeNotifier,
            );
          } else {
            return ChatPage(
              themeModeNotifier: themeModeNotifier,
              fontSizeNotifier: fontSizeNotifier,
            );
          }
        }
        return Scaffold(
          body: Center(
            child: CircularProgressIndicator(),
          ),
        );
      },
    );
  }
}

class ValueListenableBuilder2<A, B> extends StatelessWidget {
  final ValueListenable<A> first;
  final ValueListenable<B> second;
  final Widget Function(BuildContext, A, B, Widget?) builder;

  const ValueListenableBuilder2({
    required this.first,
    required this.second,
    required this.builder,
  });

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<A>(
      valueListenable: first,
      builder: (context, firstValue, child) {
        return ValueListenableBuilder<B>(
          valueListenable: second,
          builder: (context, secondValue, child) {
            return builder(context, firstValue, secondValue, child);
          },
        );
      },
    );
  }
}
