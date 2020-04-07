using System;
using System.Threading;
using DotNetify;

namespace LazyLoadRouting
{
   public class Home : BaseVM
   {
      private Timer _timer;
      public string Greetings => "Hello World!";
      public DateTime ServerTime => DateTime.Now;

      public Home()
      {
         _timer = new Timer(state =>
         {
            Changed(nameof(ServerTime));
            PushUpdates();
         }, null, 0, 1000);
      }

      public override void Dispose() => _timer.Dispose();
   }
}