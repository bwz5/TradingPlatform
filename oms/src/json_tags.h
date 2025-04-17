/* JSON_MACROS.h */
#ifndef JSON_MACROS_H_
#define JSON_MACROS_H_

/* You already have these in HTML_TAGS.h */
#define SCOPE(atStart, atEnd) \
    for (int _s= ((atStart), 1); _s ; _s = ((atEnd), 0))
#define _(...)  sprintf(hr->body_buffer, __VA_ARGS__)

/* ---- JSON structural markers ------------------------------------ */
#define JSON_OBJECT()   SCOPE(_("{"), _("}"))
#define JSON_ARRAY()    SCOPE(_("["), _("]"))

/* ---- Key helpers ------------------------------------------------- */
#define JKEY(key)     _("\"%s\":", key)      /* emits "key":           */
#define JSTR(val)     _("\"%s\"",  val)      /* emits "value"          */
#define JNUM(val)     _("%d",      val)      /* emits 42               */
#define JBOOL(b)      _("%s",      (b) ? "true" : "false")
#define JNULL         _("null")

/* ---- Convenience one‑liners ------------------------------------- */
#define JKV_STR(key,val)  _("\"%s\":\"%s\"", key, val)   /* "k":"v" */
#define JKV_NUM(key,val)  _("\"%s\":%d",     key, val)   /* "k":42  */
#define JKV_BOOL(key,b)   _("\"%s\":%s",     key, (b) ? "true":"false")

/* ---- Comma ------------------------------------------------------- */
#define COMMA  _(",")

#endif
